import { Prisma } from '@prisma/client';
import { z } from 'zod';
import generate from 'project-name-generator';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';
import slugify from '~/utils/slugify';
import { TRPCError } from '@trpc/server';
import denyList from '../utils/slugDenyList';
import { ResourceOwnerType } from '@zipper/types';
import { clerkClient } from '@clerk/nextjs/server';

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
  organizationId: true,
});

export const appRouter = createRouter()
  // create
  .mutation('add', {
    input: z
      .object({
        name: z.string().min(3).optional(),
        slug: z
          .string()
          .min(3)
          .transform((s) => slugify(s))
          .optional(),
        description: z.string().optional(),
      })
      .optional(),
    async resolve({
      input = { name: undefined, slug: undefined, description: undefined },
      ctx,
    }) {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const { name, description } = input;
      let { slug } = input;

      // if there's a name but no slug, use the name to generate a slug
      if (name && !slug) {
        slug = slugify(name);
      }

      // if the provided slug or slugified name is in the deny list, set slug to undefined so that it gets replaced
      if (denyList.find((d) => d === input.slug)) {
        slug = undefined;
      }

      // fallback to generating a random slug if there's no name or slug provided or the name or slug is on the deny list
      if (!slug) {
        slug = generate({ words: 3 }).dashed;
      }

      // increase our chances of getting a unique slug by adding a random number to the end
      // we create 3 possible slugs and check if any of them are already taken
      let possibleSlugs = [
        slug,
        `${slug}-${Math.random() * 100}`,
        `${slug}-${Math.random() * 100}`,
      ];

      // find existing apps with any of the slugs in possibleSlugs
      const appsWithSameSlug = await prisma.app.findMany({
        where: { slug: { in: possibleSlugs } },
      });

      // if there are existing apps with the same slug, remove the slug from possibleSlugs
      if (appsWithSameSlug.length > 0) {
        const existingSlugs = appsWithSameSlug.map((a) => a.slug);
        possibleSlugs = possibleSlugs.filter((s) => {
          return !existingSlugs.includes(s);
        });
      }

      if (possibleSlugs.length === 0) {
        throw new TRPCError({
          message: 'No possible slugs',
          code: 'INTERNAL_SERVER_ERROR',
        });
      }

      const app = await prisma.app.create({
        data: {
          name,
          description,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          slug: possibleSlugs[0]!,
          organizationId: ctx.orgId,
          createdById: ctx.userId,
          editors: {
            create: {
              userId: ctx.userId,
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
      if (!ctx.userId) return [];
      const where: Prisma.AppWhereInput = {
        parentId: input?.parentId,
      };

      if (ctx.orgId) {
        // return apps that belong to the organization workspace you're currently in
        where.organizationId = ctx.orgId;
      } else {
        // if you're in your personal workspace, return apps that you created outside the context of an org
        // TODO: figure out how to show apps you were invited to
        where.OR = [
          { organizationId: null, createdById: ctx.userId },
          { organizationId: null, editors: { some: { userId: ctx.userId } } },
        ];
      }
      return prisma.app.findMany({
        where,
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
              OR: [
                {
                  editors: {
                    some: { userId: ctx.userId },
                  },
                },
                { organizationId: ctx.orgId },
              ],
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
  .query('byResourceOwnerAndAppSlugs', {
    input: z.object({
      resourceOwnerSlug: z.string(),
      appSlug: z.string(),
    }),
    async resolve({ ctx, input }) {
      //find resouce owner (org or user) based on slug
      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          slug: input.resourceOwnerSlug,
        },
      });

      // start building the where clause for the app query
      const where: Prisma.AppWhereInput = {
        slug: input.appSlug,
      };

      // if the resource owner we found above is an organization, add the organization id to the where clause
      if (resourceOwner.resourceOwnerType === ResourceOwnerType.Organization) {
        where.organizationId = resourceOwner.resourceOwnerId;
      }

      // if the resource owner we found above is a user, add the user id to the where clause
      if (resourceOwner.resourceOwnerType === ResourceOwnerType.User) {
        where.createdById = resourceOwner.resourceOwnerId;
      }

      const app = await prisma.app.findFirstOrThrow({
        where,
        select: {
          ...defaultSelect,
          scripts: true,
          scriptMain: { include: { script: true } },
          editors: true,
          settings: true,
          connectors: true,
        },
      });

      // if the app is private, check if the authed user has access via the editors relation or organization id
      if (app.isPrivate) {
        if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        let orgIds: string[] = [];
        if (
          resourceOwner.resourceOwnerType === ResourceOwnerType.Organization
        ) {
          const userOrgMembershipList =
            await clerkClient.users.getOrganizationMembershipList({
              userId: ctx.userId,
            });
          orgIds = userOrgMembershipList.map((m) => {
            return m.organization.id;
          });
        }

        if (
          (app.organizationId && orgIds.includes(app.organizationId)) ||
          app.editors.find((e) => e.userId === ctx.userId)
        ) {
          return app;
        }
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      // return the public app
      return app;
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
      if (!ctx.userId) {
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
      if (!ctx.userId) {
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
              userId: ctx.userId,
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
        ctx,
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
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await prisma.app.deleteMany({
        where: {
          id: input.id,
          editors: { some: { userId: ctx.userId } },
        },
      });

      return {
        id: input.id,
      };
    },
  });
