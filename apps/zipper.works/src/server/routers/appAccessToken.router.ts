import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppReadPermission } from '../utils/authz.utils';
import { bcryptHash } from '@zipper/utils';
import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';

const defaultSelect = Prisma.validator<Prisma.AppAccessTokenSelect>()({
  identifier: true,
  appId: true,
  userId: true,
  description: true,
  deletedAt: true,
});

export const appAccessTokenRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      appId: z.string(),
      description: z.string(),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await hasAppReadPermission({
        ctx,
        appId: input.appId,
      });

      const { appId, description } = input;

      const secret = randomUUID().replace(/-/g, '').slice(0, 21);
      const identifier = randomUUID().replace(/-/g, '').slice(0, 21);

      const hashedSecret = await bcryptHash(secret);

      const appAccessToken = await prisma.appAccessToken.create({
        data: {
          identifier,
          appId,
          userId: ctx.userId,
          hashedSecret,
          description,
        },
        select: defaultSelect,
      });

      if (!appAccessToken)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      return `zaat.${identifier}.${secret}`;
    },
  })
  // read
  .query('getForCurrentUser', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await hasAppReadPermission({
        ctx,
        appId: input.appId,
      });

      return prisma.appAccessToken.findMany({
        where: {
          appId: input.appId,
          userId: ctx.userId,
          deletedAt: null,
        },
        select: defaultSelect,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      identifier: z.string(),
    }),
    async resolve({ ctx, input }) {
      await prisma.appAccessToken.deleteMany({
        where: {
          identifier: input.identifier,
          userId: ctx.userId,
        },
      });

      return {
        id: input.identifier,
      };
    },
  });
