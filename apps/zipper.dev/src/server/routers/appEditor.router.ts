import clerk from '@clerk/clerk-sdk-node';
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
        ctx,
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
        ctx,
        appId: input.appId,
      });

      const users = await clerk.users.getUserList({
        emailAddress: [input.email],
      });

      const userId = users[0]?.id;

      //if there's an existing user, add them as an app editor
      if (userId) {
        await prisma.appEditor.upsert({
          where: {
            userId_appId: {
              userId: userId,
              appId: input.appId,
            },
          },
          create: {
            app: {
              connect: { id: input.appId },
            },
            isOwner: input.isOwner,
            userId: userId,
          },
          update: {},
          select: defaultSelect,
        });

        return 'added';
      }

      // if there's no existing user, create an invitation and add them to pending
      try {
        await clerk.invitations.createInvitation({
          emailAddress: input.email,
          redirectUrl: `${
            process.env.NODE_ENV === 'production' ? 'https' : 'http'
          }://${process.env.NEXT_PUBLIC_HOST}${
            process.env.NODE_ENV === 'production' ? '' : ':3000'
          }/sign-up`,
        });

        await prisma.pendingAppEditor.create({
          data: {
            inviterUserId: ctx.userId!,
            ...input,
          },
        });

        return 'pending';
      } catch (e: any) {
        return e?.errors[0]?.code === 'duplicate_record' ? 'pending' : 'error';
      }
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

      const pending = await prisma.pendingAppEditor.findMany({
        where: {
          appId: input.appId,
        },
        select: { email: true },
      });
      let users: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      }[];
      if (input.includeUsers) {
        users = await prisma.user.findMany({
          where: {
            id: { in: appEditors.map((appEditor) => appEditor.userId) },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });
      }

      const withUser = appEditors.map((appEditor) => {
        const user = users.find((user) => user.id === appEditor.userId);
        return {
          ...appEditor,
          user,
        };
      });

      return { appEditors: withUser, pending };
    },
  })
  .mutation('acceptPendingInvitations', {
    async resolve({ ctx }) {
      if (!ctx.userId) return;

      const user = await clerk.users.getUser(ctx.userId!);
      if (!user) return;

      const pending = await prisma.pendingAppEditor.findMany({
        where: {
          email: { in: user.emailAddresses.map((email) => email.emailAddress) },
        },
      });

      await prisma.pendingAppEditor.deleteMany({
        where: {
          email: { in: user.emailAddresses.map((email) => email.emailAddress) },
        },
      });

      return prisma.appEditor.createMany({
        data: pending.map((pendingAppEditor) => ({
          appId: pendingAppEditor.appId,
          isOwner: pendingAppEditor.isOwner,
          userId: ctx.userId!,
        })),
      });
    },
  })
  .mutation('deletePendingInvitation', {
    input: z.object({
      appId: z.string(),
      email: z.string().email(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({ ctx, appId: input.appId });

      return prisma.pendingAppEditor.delete({
        where: {
          email_appId: {
            ...input,
          },
        },
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
        ctx,
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
