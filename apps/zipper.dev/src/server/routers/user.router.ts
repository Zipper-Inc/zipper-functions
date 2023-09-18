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
import { initApplet } from '@zipper-inc/client-js';
import { captureMessage } from '@sentry/nextjs';

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
  .mutation('contactSupport', {
    input: z.object({
      request: z.string(),
      file: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      if (ctx.userId && process.env.FEEDBACK_TRACKER_API_KEY) {
        const user = await prisma.user.findUnique({
          where: {
            id: ctx.userId,
          },
          select: {
            name: true,
            email: true,
          },
        });

        const formData = new FormData();
        formData.append(
          'from',
          user?.email ? user.email : 'support@zipper.works',
        );
        formData.append('to[0]', 'support@zipper.works');
        formData.append('subject', 'Help needed');
        formData.append('sender_name', user?.name ? user.name : 'Anonymous');
        formData.append('body', input.request);
        formData.append('text', input.request);
        const file = input.file ? input.file.split(',')[1] : '';
        const buffer = Buffer.from(file ? file : '', 'base64');

        const fileType = input.file
          ? input.file.split(';')[0]?.split(':')[1]
          : '';

        const typeObject = {
          type: fileType,
        };

        const blob = new Blob([buffer], typeObject);
        // // set the file name in blob var
        formData.append(
          'attachments[0]',
          blob,
          `file.${fileType?.split('/')[1]}`,
        );

        const options = {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.FRONT_SECRET}`,
          },
          body: formData,
        };

        fetch('https://api2.frontapp.com/channels/cha_e8j14/messages', options)
          .then((response) => response.json())
          .then((response) => console.log(response))
          .catch((err) => console.error(err));

        return true;
      }
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

        try {
          await initApplet('feedback-tracker', {
            token: process.env.FEEDBACK_TRACKER_API_KEY,
          })
            .path('create.ts')
            .run({
              email: user?.email,
              url: input.url,
              feedback: input.feedback,
            });

          return true;
        } catch (e) {
          captureMessage('Failed to submit feedback', {
            extra: {
              input,
            },
          });

          return false;
        }
      }
    },
  })
  .query('isSlugAvailable', {
    input: z.object({
      slug: z.string().transform((s) => slugify(s).toLowerCase()),
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
      slug: z.string().transform((s) => slugify(s).toLowerCase()),
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
