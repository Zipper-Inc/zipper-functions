import { z } from 'zod';
import { createProtectedRouter } from '../createRouter';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { generateAccessToken } from '~/utils/jwt-utils';
import { encryptToHex } from '@zipper/utils';
import fetch from 'node-fetch';
import { Prisma } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const defaultSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  image: true,
  slug: true,
});

export const userRouter = createProtectedRouter()
  // Remove - we can now include user profiles when getting app runs
  .query('profilesForUserIds', {
    input: z.object({
      ids: z.array(z.string()),
    }),
    async resolve({ input }) {
      return prisma.user.findMany({
        where: {
          id: { in: input.ids },
        },
        select: defaultSelect,
      });
    },
  })
  // Remove - everything we need to show the profile should be in the jwt
  .query('profileForUserId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      if (input.id.startsWith('temp_')) return;
      return prisma.user.findUnique({
        where: {
          id: input.id,
        },
        select: defaultSelect,
      });
    },
  })
  .mutation('addZipperAuthCode', {
    async resolve({ ctx }) {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      if (!ctx.req) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const result = await prisma.zipperAuthCode.create({
        data: {
          userId: ctx.userId,
          expiresAt: Date.now() + 30 * 1000,
        },
      });

      return encryptToHex(result.code, process.env.ENCRYPTION_KEY);
    },
  })
  .mutation('generateAccessToken', {
    input: z.object({
      expiresIn: z.string().default('30s'),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.userId) return new TRPCError({ code: 'UNAUTHORIZED' });
      const token = await getToken({ req: ctx.req! });

      return generateAccessToken(
        {
          userId: ctx.userId,
          authToken: token,
        },
        { expiresIn: input.expiresIn },
      );
    },
  })
  .mutation('submitFeedback', {
    input: z.object({
      feedback: z.string(),
      url: z.string(),
    }),
    async resolve({ ctx, input }) {
      if (ctx.userId && process.env.FEEDBACK_TRACKER_API_KEY) {
        const user = await prisma.user.findUnique({
          where: {
            id: ctx.userId,
          },
          select: {
            email: true,
          },
        });

        const res = await fetch(
          'https://feedback-tracker.zipper.run/create.ts/api/json',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.FEEDBACK_TRACKER_API_KEY}`,
              Accept: 'application/json',
            },
            body: JSON.stringify({
              email: user?.email,
              url: input.url,
              feedback: input.feedback,
            }),
          },
        );

        return res.status;
      }
    },
  });
