import { TRPCError } from '@trpc/server';
import { Context } from '../context';
import { prisma } from '../prisma';

export const hasAppEditPermission = async ({
  ctx,
  appId,
  throwError = true,
}: {
  ctx: Context;
  appId: string;
  throwError?: boolean;
}) => {
  const { userId, orgId } = ctx;
  if (!userId) {
    if (throwError) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return false;
  }

  try {
    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        OR: [
          {
            editors: { some: { userId } },
          },
          {
            organizationId: orgId,
          },
        ],
      },
    });

    if (!app) {
      if (throwError) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You do not have access to edit ${appId}`,
        });
      }
    }

    return !!app;
  } catch (error) {
    if (throwError) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: `You do not have access to edit ${appId}`,
      });
    }
    return false;
  }
};

export const hasAppReadPermission = async ({
  ctx,
  appId,
}: {
  ctx: Context;
  appId: string;
}) => {
  try {
    await prisma.app.findFirstOrThrow({
      where: {
        id: appId,
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            OR: [
              {
                editors: {
                  some: { userId: ctx.userId },
                },
              },
              {
                organizationId: ctx.orgId,
              },
            ],
          },
        ],
      },
    });

    return true;
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `You do not have access to read ${appId}`,
    });
  }
};
