import { TRPCError } from '@trpc/server';
import { Context } from '../context';
import { prisma } from '../prisma';

export const hasAppEditPermission = async ({
  ctx,
  appId,
}: {
  ctx: Context;
  appId: string;
}) => {
  const { userId, orgId } = ctx;
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    await prisma.app.findFirstOrThrow({
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
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `You do not have access to edit ${appId}`,
    });
  }
  return true;
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
