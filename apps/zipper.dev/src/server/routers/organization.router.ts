import { z } from 'zod';
import { hasOrgAdminPermission } from '../utils/authz.utils';
import { UserRole } from '@zipper/types';
import * as trpc from '@trpc/server';
import { Context } from '../context';
import { prisma } from '../prisma';
import crypto from 'crypto';

function createProtectedOrganizationRouter() {
  return trpc.router<Context>().middleware(({ ctx, next }) => {
    if (!ctx.orgId) {
      throw new trpc.TRPCError({
        code: 'NOT_FOUND',
        message: 'User does not have a current organization set',
      });
    }

    if (!hasOrgAdminPermission(ctx)) {
      throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.userId,
      },
    });
  });
}

export const organizationRouter = createProtectedOrganizationRouter()
  .query('getMemberships', {
    async resolve({ ctx }) {
      return prisma.organizationMembership.findMany({
        where: {
          organizationId: ctx.orgId,
        },
      });
    },
  })
  .query('getPendingInvitations', {
    async resolve({ ctx }) {
      return prisma.organizationInvitation.findMany({
        where: {
          organizationId: ctx.orgId,
        },
      });
    },
  })
  .mutation('update', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      return prisma.organization.update({
        where: {
          id: ctx.orgId,
        },
        data: input,
      });
    },
  })
  .mutation('updateMember', {
    input: z.object({
      userId: z.string(),
      data: z.object({
        role: z.nativeEnum(UserRole),
      }),
    }),
    async resolve({ input, ctx }) {
      if (input.userId === ctx.userId) {
        throw new trpc.TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot update your own role',
        });
      }

      return prisma.organizationMembership.update({
        where: {
          organizationId_userId: {
            organizationId: ctx.orgId!,
            userId: input.userId,
          },
        },
        data: input.data,
      });
    },
  })
  .mutation('removeMember', {
    input: z.object({
      userId: z.string(),
    }),
    async resolve({ input, ctx }) {
      const membership = await prisma.organizationMembership.findUniqueOrThrow({
        where: {
          organizationId_userId: {
            organizationId: ctx.orgId!,
            userId: input.userId,
          },
        },
      });

      if (membership.role === UserRole.Admin) {
        const existingAdmins = await prisma.organizationMembership.findMany({
          where: {
            organizationId: ctx.orgId!,
            role: UserRole.Admin,
          },
        });

        if (existingAdmins.length === 1) {
          throw new trpc.TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot remove the last admin',
          });
        }
      }

      return prisma.organizationMembership.delete({
        where: {
          organizationId_userId: {
            organizationId: ctx.orgId!,
            userId: input.userId,
          },
        },
      });
    },
  })
  // revisit using https://uploadthing.com
  // .mutation('setLogo', {
  //   input: z.object({
  //     id: z.string(),
  //   }),
  //   async resolve({ input, ctx }) {},
  // })
  .mutation('inviteMember', {
    input: z.object({
      email: z.string().email(),
      role: z.nativeEnum(UserRole),
    }),
    async resolve({ input, ctx }) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: input.email,
        },
      });

      const signInOrSignUp = existingUser ? 'signin' : 'signup';

      const invite = await prisma.organizationInvitation.create({
        data: {
          email: input.email,
          organizationId: ctx.orgId!,
          role: input.role,
          token: crypto.randomBytes(4).toString('hex'),
          redirectUrl: `${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL}/${signInOrSignUp}`,
        },
      });

      // await sendEmail({})

      return invite;
    },
  });
