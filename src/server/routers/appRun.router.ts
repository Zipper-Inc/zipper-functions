import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';

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
    async resolve({ input }) {
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
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string(),
      appId: z.string(),
    }),
    async resolve({ input }) {
      await prisma.appRun.deleteMany({
        where: {
          id: input.id,
          appId: input.appId,
        },
      });

      return {
        id: input.id,
      };
    },
  });
