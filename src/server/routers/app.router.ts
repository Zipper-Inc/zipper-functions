import { Prisma } from '@prisma/client';
import { z } from 'zod';
import generate from 'project-name-generator';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  scriptMain: true,
  isPrivate: true,
  submissionState: true,
  parent: true,
  lastDeploymentVersion: true,
});

export const appRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      slug: z.string().min(5).max(60),
    }),
    async resolve({ input, ctx }) {
      const thirdPartyAccount = await prisma.thirdPartyAccount.findUnique({
        where: { id: ctx.superTokenId },
      });

      console.log(ctx.superTokenId);

      const app = await prisma.app.create({
        data: {
          ...input,
          editors: {
            create: {
              userId: thirdPartyAccount?.userId || '',
              isOwner: true,
            },
          },
        },
        select: defaultSelect,
      });

      if (!app) return;

      const defaultCode = '{}';

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
      if (!ctx.superTokenId) return [];
      return prisma.app.findMany({
        where: {
          parentId: input?.parentId,
          editors: { some: { user: { superTokenId: ctx.superTokenId } } },
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
                some: { user: { superTokenId: ctx.superTokenId } },
              },
            },
          ],
        },
        select: {
          ...defaultSelect,
          scripts: true,
          scriptMain: { include: { script: true } },
          editors: {
            include: { user: { select: { superTokenId: true } } },
          },
        },
      });
    },
  })
  // update
  .mutation('fork', {
    input: z.object({
      id: z.string().uuid(),
    }),
    async resolve({ input, ctx }) {
      const { id } = input;

      const app = await prisma.app.findFirstOrThrow({
        where: { id },
        include: { scripts: true, scriptMain: true },
      });

      const user = await prisma.user.findFirstOrThrow({
        where: { superTokenId: ctx.superTokenId },
      });

      const fork = await prisma.app.create({
        data: {
          slug: generate().dashed,
          description: app.description,
          parentId: app.id,
          editors: {
            create: {
              userId: user.id,
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
        description: z.string().optional(),
        isPrivate: z.boolean().optional(),
        lastDeploymentVersion: z.string().optional(),
        scripts: z
          .array(
            z.object({
              id: z.string().uuid(),
              data: z.object({
                name: z.string().min(3).max(255),
                description: z.string(),
                code: z.string(),
              }),
            }),
          )
          .optional(),
      }),
    }),
    async resolve({ input, ctx }) {
      await hasAppEditPermission({
        superTokenId: ctx.superTokenId,
        appId: input.id,
      });

      const { id, data } = input;
      const { scripts, ...rest } = data;

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
      await prisma.app.deleteMany({
        where: {
          id: input.id,
          editors: { some: { userId: ctx.superTokenId } },
        },
      });

      return {
        id: input.id,
      };
    },
  });
