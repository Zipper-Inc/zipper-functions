import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppReadPermission } from '../utils/authz.utils';

export const appLogRouter = createRouter().mutation('get', {
  input: z.object({
    appId: z.string(),
    version: z.string(),
    runId: z.string().optional(),
    fromTimestamp: z.number().optional(),
  }),
  async resolve({ ctx, input }) {
    await hasAppReadPermission({
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
  },
});
