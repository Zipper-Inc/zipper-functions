import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import parser from 'cron-parser';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { queues } from '../queue';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import { createTRPCRouter, publicProcedure } from '../root';

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

      const { appId, crontab, inputs, filename } = input;

      try {
        const parsed = parser.parseExpression(crontab);
        console.log(parsed.fields.second.toString());
        if (parsed.fields.second && parsed.fields.second.toString() !== '0') {
          throw new Error('No seconds allowed');
        }
      } catch (error) {
        throw new Error('Invalid crontab');
      }

      const schedule = await prisma.schedule.create({
        data: {
          appId,
          crontab,
          inputs,
          filename,
          userId: ctx.userId!,
        },
        select: defaultSelect,
      });

      queues.schedule.add(
        schedule.id,
        { scheduleId: schedule.id },
        { repeat: { pattern: schedule.crontab } },
      );

      return schedule;
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

      await prisma.schedule.deleteMany({
        where: {
          id: input.id,
          appId: input.appId,
        },
      });

      const repeatableJobs = await queues.schedule.getRepeatableJobs();
      const job = repeatableJobs.find((job) => job.name === input.id);
      console.log('deleting job: ', job);
      if (job) {
        const success = await queues.schedule.removeRepeatableByKey(job.key);
        if (!success)
          throw new TRPCError({
            message: 'something went wrong deleting the scheduled job',
            code: 'INTERNAL_SERVER_ERROR',
          });
      }

      return {
        id: input.id,
      };
    }),
});
