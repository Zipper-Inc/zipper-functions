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
