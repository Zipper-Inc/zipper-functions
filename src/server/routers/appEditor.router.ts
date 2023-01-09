import clerk, { User } from '@clerk/clerk-sdk-node';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';

const defaultSelect = Prisma.validator<Prisma.AppEditorSelect>()({
  app: true,
  userId: true,
});

export const appEditorRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      appId: z.string(),
      userId: z.string(),
      isOwner: z.boolean().optional().default(false),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        userId: ctx.user?.id,
        appId: input.appId,
      });

      return prisma.appEditor.create({
        data: {
          ...input,
        },
        select: defaultSelect,
      });
    },
  })
  .mutation('invite', {
    input: z.object({
      appId: z.string(),
      email: z.string(),
      isOwner: z.boolean().optional().default(false),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        userId: ctx.user?.id,
        appId: input.appId,
      });

      if (!ctx.user) return;

      return prisma.appEditor.create({
        data: {
          app: {
            connect: { id: input.appId },
          },
          isOwner: input.isOwner,
          userId: ctx.user.id,
        },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('all', {
    input: z.object({
      appId: z.string(),
      includeUsers: z.boolean().optional().default(false),
    }),
    async resolve({ input }) {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      const appEditors = await prisma.appEditor.findMany({
        where: {
          appId: input.appId,
        },
        select: defaultSelect,
      });

      let users: {
        id: string;
        fullName: string | null;
        primaryEmailAddress: string | undefined;
        profileImageUrl: string;
      }[] = [];
      if (input.includeUsers) {
        const clerkUsers = await clerk.users.getUserList({
          userId: appEditors.map((appEditor) => appEditor.userId),
        });

        users = clerkUsers.map((clerkUser) => ({
          id: clerkUser.id,
          fullName:
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : null,
          primaryEmailAddress: clerkUser.emailAddresses.find(
            (clerkEmail) => clerkEmail.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress,
          profileImageUrl: clerkUser.profileImageUrl,
        }));
      }

      return appEditors.map((appEditor) => {
        const user = users.find((user) => user.id === appEditor.userId);
        return {
          ...appEditor,
          user,
        };
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      userId: z.string(),
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        userId: ctx.user?.id,
        appId: input.appId,
      });

      await prisma.appEditor.deleteMany({
        where: {
          ...input,
        },
      });

      return {
        input,
      };
    },
  });
