import { z } from 'zod';
import clerk from '@clerk/clerk-sdk-node';
import { createProtectedRouter } from '../createRouter';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { generateAccessToken } from '~/utils/jwt-utils';
import { encryptToHex } from '@zipper/utils';
import { getAuth } from '@clerk/nextjs/server';
import fetch from 'node-fetch';
import { Prisma } from '@prisma/client';

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
  // Remove - moved to the organization router
  .mutation('sendOrganizationInvitation', {
    input: z.object({
      organizationId: z.string(),
      email: z.string().email(),
      role: z.enum(['admin', 'basic_member']),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const userOrgMemberList = await clerk.users.getOrganizationMembershipList(
        {
          userId: ctx.userId,
        },
      );
      const isInviterAdmin = userOrgMemberList.find((uo) => {
        return (
          uo.organization.id === input.organizationId && uo.role === 'admin'
        );
      });

      if (!isInviterAdmin) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const invitee = await clerk.users.getUserList({
        emailAddress: [input.email],
      });

      const signInOrSignUp = invitee.length > 0 ? 'sign-in' : 'sign-up';

      try {
        const invitation =
          await clerk.organizations.createOrganizationInvitation({
            emailAddress: input.email,
            organizationId: input.organizationId,
            inviterUserId: ctx.userId,
            role: input.role,
            redirectUrl: `${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL}/${signInOrSignUp}`,
          });

        return invitation;
      } catch (e: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e.toString(),
        });
      }
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
      const sessionClaims = ctx.req ? getAuth(ctx.req).sessionClaims : null;

      return generateAccessToken(
        {
          userId: ctx.userId,
          sessionClaims,
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
      if (ctx.userId && ctx.req && process.env.FEEDBACK_TRACKER_API_KEY) {
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
              email: getAuth(ctx.req).sessionClaims?.primary_email_address,
              url: input.url,
              feedback: input.feedback,
            }),
          },
        );

        return res.status;
      }
    },
  });
