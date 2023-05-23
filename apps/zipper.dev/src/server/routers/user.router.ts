import { z } from 'zod';
import clerk from '@clerk/clerk-sdk-node';
import { createProtectedRouter } from '../createRouter';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { encrypt, encryptToBase64, encryptToHex } from '@zipper/utils';
import { getAuth } from '@clerk/nextjs/server';
import { generateAccessToken } from '~/utils/jwt-utils';

export const userRouter = createProtectedRouter()
  .query('profilesForUserIds', {
    input: z.object({
      ids: z.array(z.string()),
    }),
    async resolve({ input }) {
      const users = await clerk.users.getUserList({ userId: input.ids });
      return users.map((user) => ({
        id: user.id,
        fullName:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : null,
        primaryEmailAddress: user.emailAddresses.find(
          (clerkEmail) => clerkEmail.id === user.primaryEmailAddressId,
        )?.emailAddress,
        profileImageUrl: user.profileImageUrl,
      }));
    },
  })
  .query('profileForUserId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      if (input.id.startsWith('temp_')) return;
      const user = await clerk.users.getUser(input.id);
      return {
        id: user.id,
        fullName:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : null,
        primaryEmailAddress: user.emailAddresses.find(
          (clerkEmail) => clerkEmail.id === user.primaryEmailAddressId,
        )?.emailAddress,
        profileImageUrl: user.profileImageUrl,
      };
    },
  })
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
            redirectUrl: `${
              process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000'
                : 'https://' + process.env.NEXT_PUBLIC_HOST
            }/${signInOrSignUp}`,
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
      return generateAccessToken(
        { userId: ctx.userId },
        { expiresIn: input.expiresIn },
      );
    },
  });
