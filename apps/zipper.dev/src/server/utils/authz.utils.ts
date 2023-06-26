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
  const { userId, organizations } = ctx;
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
            organizationId: { in: Object.keys(organizations || {}) },
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
                organizationId: { in: Object.keys(ctx.organizations || {}) },
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

export const hasOrgAdminPermission = async (ctx: Context) => {
  try {
    if (!ctx.userId || !ctx.orgId) {
      return false;
    }

    const orgMem = await prisma.organizationMembership.findUniqueOrThrow({
      where: {
        organizationId_userId: {
          organizationId: ctx.orgId,
          userId: ctx.userId,
        },
      },
    });

    if (orgMem.role === 'ADMIN') {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};
