import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';

export const hasAppEditPermission = async ({
  superTokenId,
  appId,
}: {
  superTokenId?: string;
  appId: string;
}) => {
  if (!superTokenId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    await prisma.appEditor.findFirstOrThrow({
      where: {
        appId,
        user: {
          superTokenId,
        },
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
  superTokenId,
  appId,
}: {
  superTokenId?: string;
  appId: string;
}) => {
  if (!superTokenId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    await prisma.app.findFirstOrThrow({
      where: {
        id: appId,
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            editors: {
              some: { user: { superTokenId } },
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
