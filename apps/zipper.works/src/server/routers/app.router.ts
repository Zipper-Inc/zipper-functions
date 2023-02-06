import { Prisma } from '@prisma/client';
import { z } from 'zod';
import generate from 'project-name-generator';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';
import slugify from '~/utils/slugify';
import { TRPCError } from '@trpc/server';
import denyList from '../utils/slugDenyList';

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  name: true,
  slug: true,
  description: true,
  isPrivate: true,
  lastDeploymentVersion: true,
  parentId: true,
  submissionState: true,
  createdAt: true,
  updatedAt: true,
});

export const appRouter = createRouter()
  // create
  .mutation('add', {
    async resolve({ ctx }) {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const app = await prisma.app.create({
        data: {
          slug: generate({ words: 3 }).dashed,
          organizationId: ctx.orgId,
          editors: {
            create: {
              userId: ctx.user.id,
              isOwner: true,
            },
          },
        },
        select: defaultSelect,
      });

      if (!app) return;

      const defaultCode = [
        'async function main({worldString}: {worldString: string}) {',
        '  return `Hello ${worldString}`;',
        '}',
      ].join('\n');

      const scriptMain = await prisma.scriptMain.create({
        data: {
          app: { connect: { id: app.id } },
          script: {
            create: {
              code: defaultCode,
              name: 'main',
              filename: 'main.ts',
              appId: app.id,
              order: 0,
            },
          },
        },
      });

      return { ...app, scriptMain };
    },
  })
  // read
  .query('all', {
    input: z
      .object({
        submissionState: z.number().optional(),
      })
      .optional(),
    async resolve({ input }) {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.app.findMany({
        where: {
          isPrivate: false,
          submissionState: input?.submissionState,
        },
        select: defaultSelect,
      });
    },
  })
  .query('byAuthedUser', {
    input: z
      .object({
        parentId: z.string().optional(),
      })
      .optional(),
    async resolve({ ctx, input }) {
      if (!ctx.user) return [];
      return prisma.app.findMany({
        where: {
          parentId: input?.parentId,
          organizationId: ctx.orgId,
          editors: { some: { userId: ctx.user.id } },
        },
        orderBy: { updatedAt: 'desc' },
        select: defaultSelect,
      });
    },
  })
  .query('byId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      return prisma.app.findFirstOrThrow({
        where: {
          id: input.id,
          OR: [
            { isPrivate: false },
            {
              editors: {
                some: { userId: ctx.user?.id },
              },
            },
          ],
        },
        select: {
          ...defaultSelect,
          scripts: true,
          scriptMain: { include: { script: true } },
          editors: true,
          settings: true,
          connectors: true,
        },
      });
    },
  })
  .query('validateSlug', {
    input: z.object({
      slug: z
        .string()
        .min(3)
        .max(50)
        .transform((s) => slugify(s)),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const deniedSlug = denyList.find((d) => d === input.slug);
      if (deniedSlug) return false;

      const existingSlug = prisma.app.findFirst({
        where: {
          slug: input.slug,
        },
      });

      return !!existingSlug;
    },
  })
  // update
  .mutation('fork', {
    input: z.object({
      id: z.string().uuid(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const { id } = input;

      const app = await prisma.app.findFirstOrThrow({
        where: { id },
        include: { scripts: true, scriptMain: true },
      });

      const fork = await prisma.app.create({
        data: {
          slug: generate({ words: 3 }).dashed,
          description: app.description,
          parentId: app.id,
          organizationId: ctx.orgId,
          editors: {
            create: {
              userId: ctx.user.id,
              isOwner: true,
            },
          },
        },
        select: defaultSelect,
      });

      app.scripts.map(async (script, i) => {
        const forkScript = await prisma.script.create({
          data: {
            ...script,
            id: undefined,
            inputSchema: JSON.stringify(script.inputSchema),
            outputSchema: JSON.stringify(script.outputSchema),
            appId: fork.id,
            order: i,
          },
        });

        if (script.id === app.scriptMain?.scriptId) {
          await prisma.scriptMain.create({
            data: {
              app: { connect: { id: fork.id } },
              script: { connect: { id: forkScript.id } },
            },
          });
        }
      });

      return prisma.app.findUniqueOrThrow({
        where: { id: fork.id },
        select: defaultSelect,
      });
    },
  })
  // update
  .mutation('edit', {
    input: z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(3).max(255).optional(),
        slug: z
          .string()
          .min(5)
          .max(60)
          .transform((arg) => slugify(arg))
          .optional(),
        description: z.string().optional().nullable(),
        isPrivate: z.boolean().optional(),
        lastDeploymentVersion: z.string().optional(),
        scripts: z
          .array(
            z.object({
              id: z.string().uuid(),
              data: z.object({
                name: z.string().min(3).max(255).optional(),
                description: z.string().optional().nullable(),
                code: z.string().optional(),
              }),
            }),
          )
          .optional(),
      }),
    }),
    async resolve({ input, ctx }) {
      await hasAppEditPermission({
        userId: ctx.user?.id,
        appId: input.id,
      });

      const { id, data } = input;
      const { scripts, ...rest } = data;

      if (data.slug) {
        const deniedSlug = denyList.find((d) => d === data.slug);
        if (deniedSlug)
          throw new TRPCError({
            message: 'Invalid slug',
            code: 'INTERNAL_SERVER_ERROR',
          });
        const existingAppWithSlug = await prisma.app.findFirst({
          where: { slug: data.slug, id: { not: input.id } },
        });
        if (existingAppWithSlug)
          throw new TRPCError({
            message: 'Invalid slug',
            code: 'INTERNAL_SERVER_ERROR',
          });
      }

      await prisma.app.update({
        where: { id },
        data: { updatedAt: new Date(), ...rest },
        select: defaultSelect,
      });

      if (scripts) {
        await Promise.all(
          scripts.map(async (script) => {
            const { id, data } = script;
            await prisma.script.update({ where: { id }, data });
          }),
        );
      }

      return prisma.app.findUniqueOrThrow({
        where: { id },
        select: defaultSelect,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await prisma.app.deleteMany({
        where: {
          id: input.id,
          editors: { some: { userId: ctx.user.id } },
        },
      });

      return {
        id: input.id,
      };
    },
  });
