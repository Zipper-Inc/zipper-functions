import { Prisma } from '@prisma/client';
import { getZipperDotDevUrl } from '@zipper/utils';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import { sendInvitationEmail } from '../utils/invitation.utils';
import { createTRPCRouter, publicProcedure } from '../root';

const defaultSelect = Prisma.validator<Prisma.AppEditorSelect>()({
  app: true,
  userId: true,
});

export const appEditorRouter = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        userId: z.string(),
        isOwner: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
    }),
  invite: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        email: z.string(),
        isOwner: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      const user = await prisma.user.findFirst({
        where: {
          email: input.email,
        },
      });

      const userId = user?.id;

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
        const app = await prisma.app.findUniqueOrThrow({
          where: {
            id: input.appId,
          },
        });

        await prisma.pendingAppEditor.create({
          data: {
            inviterUserId: ctx.userId!,
            ...input,
          },
        });

        sendInvitationEmail({
          email: input.email,
          resourceToJoinName: app?.name || app?.slug,
          callbackUrl: `${getZipperDotDevUrl().origin}/app/${app?.id}`,
        });

        return 'pending';
      } catch (e: any) {
        return e?.errors[0]?.code === 'duplicate_record' ? 'pending' : 'error';
      }
    }),
  all: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        includeUsers: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      // if it is a private app we should test for the canUserEdit
      if (
        !hasAppEditPermission({
          ctx,
          appId: input.appId,
        })
      ) {
        return {};
      }

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
    }),
  deletePendingInvitation: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({ ctx, appId: input.appId });

      return prisma.pendingAppEditor.delete({
        where: {
          email_appId: {
            ...input,
          },
        },
      });
    }),
  delete: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
    }),
});
