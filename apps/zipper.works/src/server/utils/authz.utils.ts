import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';

export const hasAppEditPermission = async ({
  userId,
  appId,
}: {
  userId?: string;
  appId: string;
}) => {
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    await prisma.appEditor.findFirstOrThrow({
      where: {
        appId,
        userId,
      },
    });

    return true;
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `You do not have access to edit ${appId}`,
    });
  }
};

export const hasAppReadPermission = async ({
  userId,
  appId,
}: {
  userId?: string;
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
            editors: {
              some: { userId },
            },
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
