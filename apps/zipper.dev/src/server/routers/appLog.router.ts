import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import { createTRPCRouter, publicProcedure } from '../root';

export const appLogRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        version: z.string(),
        runId: z.string().optional(),
        fromTimestamp: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      const where: Prisma.AppLogWhereInput = {
        appId: input.appId,
        version: input.version,
        runId: input.runId,
      };

      if (input.fromTimestamp) {
        where.timestamp = {
          gte: new Date(input.fromTimestamp),
        };
      }

      const logs = (await prisma.appLog.findMany({
        where,
      })) as Zipper.Log.Message[];

      return logs;
    }),
  getRunId: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        runId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppReadPermission({
        ctx,
        appId: input.appId,
      });

      const logs = (await prisma.appLog.findMany({
        where: {
          appId: input.appId,
          runId: input.runId,
        },
      })) as Zipper.Log.Message[];

      return logs;
    }),
});
