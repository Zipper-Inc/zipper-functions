import { z } from 'zod';
import clerk from '@clerk/clerk-sdk-node';
import { createProtectedRouter } from '../createRouter';

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
  });
