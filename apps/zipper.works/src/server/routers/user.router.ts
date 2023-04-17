import { z } from 'zod';
import clerk from '@clerk/clerk-sdk-node';
import { createProtectedRouter } from '../createRouter';
import { TRPCError } from '@trpc/server';

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
      const isAdmin = userOrgMemberList.find((uo) => {
        return (
          uo.organization.id === input.organizationId && uo.role === 'admin'
        );
      });

      if (isAdmin) {
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
              }/sign-up`,
            });

          return invitation;
        } catch (e: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: e.toString(),
          });
        }
      }
    },
  });
