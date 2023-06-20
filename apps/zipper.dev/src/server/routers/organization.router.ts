import { z } from 'zod';
import { hasOrgAdminPermission } from '../utils/authz.utils';
import { ResourceOwnerType, UserRole } from '@zipper/types';
import * as trpc from '@trpc/server';
import { prisma } from '../prisma';
import crypto from 'crypto';
import { createRouter } from '../createRouter';
import denyList from '../utils/slugDenyList';
import slugify from '~/utils/slugify';
import { OMNI_USER_ID } from '../utils/omni.utils';

export const organizationRouter = createRouter()
  .query('getMemberships', {
    async resolve({ ctx }) {
      if (!hasOrgAdminPermission(ctx))
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });

      return prisma.organizationMembership.findMany({
        where: {
          organizationId: ctx.orgId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              slug: true,
            },
          },
        },
      });
    },
  })
  .query('getPendingInvitations', {
    async resolve({ ctx }) {
      if (!hasOrgAdminPermission(ctx))
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });

      return prisma.organizationInvitation.findMany({
        where: {
          organizationId: ctx.orgId,
        },
        select: {
          organizationId: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    },
  })
  .mutation('add', {
    input: z.object({
      name: z.string().min(3).max(50),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.userId) throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
      const slug = slugify(input.name);

      const deniedSlug = denyList.find((d) => d === slug);
      if (deniedSlug)
        throw new trpc.TRPCError({
          message: 'Invalid slug',
          code: 'INTERNAL_SERVER_ERROR',
        });

      // Only OMNI can create orgs without adding itself as admin
      const organizationMemberships =
        ctx.userId === OMNI_USER_ID
          ? undefined
          : {
              create: {
                userId: ctx.userId,
                role: UserRole.Admin,
              },
            };

      const org = await prisma.organization.create({
        data: {
          name: input.name,
          slug,
          organizationMemberships,
        },
      });

      await prisma.resourceOwnerSlug.create({
        data: {
          slug,
          resourceOwnerId: org.id,
          resourceOwnerType: ResourceOwnerType.Organization,
        },
      });

      return org;
    },
  })
  .mutation('update', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      if (!hasOrgAdminPermission(ctx))
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });

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
      if (!hasOrgAdminPermission(ctx))
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });

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
      if (!hasOrgAdminPermission(ctx))
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });

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
      if (!hasOrgAdminPermission(ctx))
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });

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
