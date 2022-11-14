import { Prisma } from '@prisma/client';
import parser from 'cron-parser';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { queues } from '../queue';

const defaultSelect = Prisma.validator<Prisma.ScheduleSelect>()({
  id: true,
  appId: true,
  crontab: true,
});

export const scheduleRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      appId: z.string(),
      crontab: z.string(),
      inputs: z.record(z.any()).optional(),
    }),
    async resolve({ input }) {
      const { appId, crontab, inputs } = input;

      try {
        parser.parseExpression(crontab);
      } catch (error) {
        throw new Error('Invalid crontab');
      }

      const schedule = await prisma.schedule.create({
        data: {
          appId,
          crontab,
          inputs,
        },
        select: defaultSelect,
      });

      queues.schedule.add(
        schedule.id,
        { scheduleId: schedule.id },
        { repeat: { pattern: schedule.crontab } },
      );

      return schedule;
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

      return prisma.schedule.findMany({
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
      id: z.string(),
      appId: z.string(),
    }),
    async resolve({ input }) {
      await prisma.schedule.deleteMany({
        where: {
          id: input.id,
          appId: input.appId,
        },
      });

      queues.schedule.removeRepeatableByKey(input.id);

      return {
        id: input.id,
      };
    },
  });
