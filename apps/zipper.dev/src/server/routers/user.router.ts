import { z } from 'zod';
import { createProtectedRouter } from '../createRouter';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { generateAccessToken } from '~/utils/jwt-utils';
import { encryptToHex } from '@zipper/utils';
import { Prisma } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import denyList from '../utils/slugDenyList';
import slugify from '~/utils/slugify';
import { ResourceOwnerType } from '@zipper/types';
import { createApplet } from '@zipper/client';

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
  .query('getAccounts', {
    async resolve({ ctx }) {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return prisma.account.findMany({
        where: {
          userId: ctx.userId,
        },
        select: {
          id: true,
          provider: true,
          providerAccountId: true,
        },
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

        const response = await createApplet('feedback-tracker', {
          token: process.env.FEEDBACK_TRACKER_API_KEY,
        })
          .path('create.ts')
          .run({
            email: user?.email,
            url: input.url,
            feedback: input.feedback,
          });

        return response.status;
      }
    },
  })
  .query('isSlugAvailable', {
    input: z.object({
      slug: z.string().transform((s) => slugify(s)),
    }),
    async resolve({ input }) {
      const deniedSlug = denyList.find((d) => d === input.slug);
      if (deniedSlug)
        return new TRPCError({
          message: 'Invalid slug',
          code: 'INTERNAL_SERVER_ERROR',
        });
      const slug = await prisma.resourceOwnerSlug.findUnique({
        where: {
          slug: input.slug,
        },
      });

      return !slug;
    },
  })
  .mutation('updateUserSlug', {
    input: z.object({
      slug: z.string().transform((s) => slugify(s)),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.userId,
        },
      });

      await prisma.resourceOwnerSlug.update({
        where: {
          slug: user.slug,
        },
        data: {
          resourceOwnerId: null,
        },
      });

      await prisma.resourceOwnerSlug.create({
        data: {
          slug: input.slug,
          resourceOwnerType: ResourceOwnerType.User,
          resourceOwnerId: ctx.userId,
        },
      });

      return prisma.user.update({
        where: {
          id: ctx.userId,
        },
        data: {
          slug: input.slug,
        },
      });
    },
  });
