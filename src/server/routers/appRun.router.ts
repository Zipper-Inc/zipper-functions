import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppReadPermission } from '../utils/authz.utils';

const defaultSelect = Prisma.validator<Prisma.AppRunSelect>()({
  id: true,
  appId: true,
  success: true,
  deploymentId: true,
  result: true,
  inputs: true,
  scheduled: true,
  createdAt: true,
});

export const appRunRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      appId: z.string(),
      success: z.boolean(),
      result: z.string(),
      deploymentId: z.string(),
      inputs: z.string(),
      scheduled: z.boolean(),
    }),
    async resolve({ input }) {
      return prisma.appRun.create({
        data: { ...input },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('all', {
    input: z.object({
      appId: z.string(),
      limit: z.number().optional(),
    }),
    async resolve({ ctx, input }) {
      await hasAppReadPermission({
        superTokenId: ctx.superTokenId,
        appId: input.appId,
      });
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.appRun.findMany({
        where: {
          appId: input.appId,
        },
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        select: defaultSelect,
      });
    },
  });
