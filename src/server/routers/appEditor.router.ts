import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';

const defaultSelect = Prisma.validator<Prisma.AppEditorSelect>()({
  app: true,
  user: true,
});

export const appEditorRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      appId: z.string(),
      userId: z.string(),
      isOwner: z.boolean().optional().default(false),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        superTokenId: ctx.superTokenId,
        appId: input.appId,
      });

      return prisma.appEditor.create({
        data: {
          ...input,
        },
        select: defaultSelect,
      });
    },
  })
  .mutation('invite', {
    input: z.object({
      appId: z.string(),
      email: z.string(),
      isOwner: z.boolean().optional().default(false),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        superTokenId: ctx.superTokenId,
        appId: input.appId,
      });

      return prisma.appEditor.create({
        data: {
          app: {
            connect: { id: input.appId },
          },
          isOwner: input.isOwner,
          user: {
            connectOrCreate: {
              where: {
                email: input.email,
              },
              create: {
                email: input.email,
                registered: false,
              },
            },
          },
        },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('all', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ input }) {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.appEditor.findMany({
        where: {
          appId: input.appId,
        },
        select: defaultSelect,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      userId: z.string(),
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        superTokenId: ctx.superTokenId,
        appId: input.appId,
      });

      await prisma.appEditor.deleteMany({
        where: {
          ...input,
        },
      });

      return {
        input,
      };
    },
  });
