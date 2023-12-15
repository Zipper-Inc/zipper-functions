import { z } from 'zod';
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
import { trackEvent } from '~/utils/api-analytics';
import { createTRPCRouter, protectedProcedure } from '../root';

const defaultSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  image: true,
  slug: true,
  displayName: true,
});

export const userRouter = createTRPCRouter({
  // Remove - we can now include user profiles when getting app runs
  profilesForUserIds: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      }),
    )
    .query(async ({ input }) => {
      return prisma.user.findMany({
        where: {
          id: { in: input.ids },
        },
        select: defaultSelect,
      });
    }),
  // Remove - we can now include user profiles when getting app runs
  profileForUserId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      if (input.id.startsWith('temp_')) return;
      return prisma.user.findUnique({
        where: {
          id: input.id,
        },
        select: defaultSelect,
      });
    }),
  settingValue: protectedProcedure
    .input(
      z.object({
        settingName: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return prisma.userSetting.findMany({
        where: {
          userId: ctx.userId,
          settingName: input.settingName,
          deletedAt: null,
        },
        select: {
          settingValue: true,
        },
      });
    }),
  setSettingValue: protectedProcedure
    .input(
      z.object({
        settingName: z.string(),
        settingValue: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.userSetting.upsert({
        where: {
          userId_settingName: {
            userId: ctx.userId,
            settingName: input.settingName,
          },
        },
        create: {
          settingName: input.settingName,
          settingValue: input.settingValue,
          userId: ctx.userId,
        },
        update: {
          settingValue: input.settingValue,
        },
      });
    }),
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
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
  }),
  addZipperAuthCode: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.req) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

    const result = await prisma.zipperAuthCode.create({
      data: {
        userId: ctx.userId,
        expiresAt: Date.now() + 30 * 1000,
      },
    });

    return encryptToHex(result.code, process.env.ENCRYPTION_KEY);
  }),
  generateAccessToken: protectedProcedure
    .input(
      z.object({
        expiresIn: z.string().default('30s'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return generateAccessToken(
        {
          userId: ctx.userId,
          session: ctx.session,
        },
        { expiresIn: input.expiresIn },
      );
    }),
  contactSupport: protectedProcedure
    .input(
      z.object({
        request: z.string(),
        file: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (process.env.FEEDBACK_TRACKER_API_KEY) {
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
    }),
  submitFeedback: protectedProcedure
    .input(
      z.object({
        feedback: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (process.env.FEEDBACK_TRACKER_API_KEY) {
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

          trackEvent({
            userId: ctx.userId,
            orgId: ctx.orgId,
            eventName: 'Gave Feedback',
            properties: {
              feedback: input.feedback,
            },
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
    }),
  isSlugAvailable: protectedProcedure
    .input(
      z.object({
        slug: z.string().transform((s) => slugify(s).toLowerCase()),
      }),
    )
    .query(async ({ input }) => {
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
    }),

  updateDisplayName: protectedProcedure
    .input(
      z.object({
        displayName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.userId,
        },
      });

      return prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          displayName: input.displayName,
        },
      });
    }),
  updateUserSlug: protectedProcedure
    .input(
      z.object({
        slug: z.string().transform((s) => slugify(s).toLowerCase()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.userId,
        },
      });

      await prisma.resourceOwnerSlug.updateMany({
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
    }),
});
