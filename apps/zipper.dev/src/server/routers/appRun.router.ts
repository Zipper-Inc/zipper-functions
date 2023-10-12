import { AppRun, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { hasAppEditPermission } from '../utils/authz.utils';
import { createTRPCRouter, publicProcedure } from '../root';

const defaultSelect = Prisma.validator<Prisma.AppRunSelect>()({
  id: true,
  appId: true,
  success: true,
  deploymentId: true,
  result: true,
  inputs: true,
  scheduleId: true,
  createdAt: true,
  originalRequestUrl: true,
  originalRequestMethod: true,
  path: true,
  userId: true,
  version: true,
});

export const appRunRouter = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        success: z.boolean(),
        result: z.string(),
        deploymentId: z.string(),
        inputs: z.record(z.any()),
        scheduleId: z.string().optional(),
        originalRequestUrl: z.string(),
        originalRequestMethod: z.string(),
        path: z.string(),
        userId: z.string(),
        version: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.appRun.create({
        data: { ...input },
        select: defaultSelect,
      });
    }),
  byId: publicProcedure
    .input(
      z.object({
        appSlug: z.string(),
        runId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const appRun = await prisma.appRun.findFirst({
        where: {
          id: { startsWith: input.runId },
          app: { slug: input.appSlug },
        },
        select: defaultSelect,
      });

      if (appRun?.userId && appRun.userId !== ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return appRun;
    }),
  all: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        limit: z.number().optional(),
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

      const appRuns = await prisma.appRun.findMany({
        where: {
          appId: input.appId,
        },
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        select: defaultSelect,
      });

      const users = await prisma.user.findMany({
        where: {
          id: {
            in: appRuns
              .filter((appRun) => !!appRun.userId)
              .map((appRun) => appRun.userId) as string[],
          },
        },
      });

      return appRuns.map((r) => {
        return { ...r, user: users.find((u) => u.id === r.userId) };
      });
    }),
});
