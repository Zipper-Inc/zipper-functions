import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';

const defaultSelect = Prisma.validator<Prisma.AppEventSelect>()({
  id: true,
  timestamp: true,
  deploymentId: true,
  eventType: true,
  eventPayload: true,
});

export const appEventRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      timestamp: z.string(),
      deploymentId: z.string(),
      eventType: z.string(),
      eventPayload: z.object({
        msg: z.string().optional(),
        level: z.string().optional(),
        boot_time: z.number().optional(),
        exception: z.string().optional(),
      }),
    }),
    async resolve({ input }) {
      return prisma.appEvent.create({
        data: {
          ...input,
        },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('all', {
    input: z.object({
      deploymentId: z.string(),
    }),
    async resolve({ input }) {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.appEvent.findMany({
        where: {
          deploymentId: input.deploymentId,
        },
        select: defaultSelect,
      });
    },
  });
