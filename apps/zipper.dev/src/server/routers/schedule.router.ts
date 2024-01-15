import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { hasAppEditPermission } from '../utils/authz.utils';
import { createTRPCRouter, publicProcedure } from '../root';
import {
  createScheduleAndAddToQueue,
  deleteSchedulesAndRemoveFromQueue,
} from '~/utils/schedule-utils';

const defaultSelect = Prisma.validator<Prisma.ScheduleSelect>()({
  id: true,
  filename: true,
  appId: true,
  crontab: true,
  userId: true,
});

export const scheduleRouter = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        crontab: z.string(),
        filename: z.string(),
        inputs: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });
      return createScheduleAndAddToQueue({
        data: input,
        userId: ctx.userId,
        defaultSelect,
      });
    }),
  all: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.schedule.findMany({
        where: {
          appId: input.appId,
        },
        include: {
          appRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }),
  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      await deleteSchedulesAndRemoveFromQueue({
        where: {
          id: input.id,
          appId: input.appId,
        },
      });

      return {
        id: input.id,
      };
    }),
});
