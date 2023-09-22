import { z } from 'zod';
import { hasOrgAdminPermission } from '../utils/authz.utils';
import { ResourceOwnerType, UserRole } from '@zipper/types';
import { prisma } from '../prisma';

import crypto from 'crypto';
import denyList from '../utils/slugDenyList';
import slugify from '~/utils/slugify';
import { sendInvitationEmail } from '../utils/invitation.utils';
import { OMNI_USER_ID } from '../utils/omni.utils';
import { getZipperDotDevUrl } from '@zipper/utils';
import { trackEvent } from '~/utils/api-analytics';
import { createTRPCRouter, publicProcedure } from '../root';
import { TRPCError } from '@trpc/server';

export const organizationRouter = createTRPCRouter({
  getMemberships: publicProcedure.query(async ({ ctx }) => {
    if (!hasOrgAdminPermission(ctx))
      throw new TRPCError({ code: 'UNAUTHORIZED' });

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
  }),
  getPendingInvitations: publicProcedure.query(async ({ ctx }) => {
    if (!hasOrgAdminPermission(ctx))
      throw new TRPCError({ code: 'UNAUTHORIZED' });

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
  }),
  add: publicProcedure
    .input(
      z.object({
        name: z.string().min(3).max(50),
        slug: z
          .string()
          .min(3)
          .max(50)
          .optional()
          .transform((arg) => arg?.toLowerCase() || undefined),
        shouldCreateResourceOwnerSlug: z.boolean().optional().default(true),
        shouldAssignAdmin: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const slug = input.slug || slugify(input.name);

      const deniedSlug = denyList.find((d) => d === slug);
      if (deniedSlug)
        throw new TRPCError({
          message: 'Invalid slug',
          code: 'INTERNAL_SERVER_ERROR',
        });

      const data: Parameters<typeof prisma.organization.create>[0]['data'] = {
        name: input.name,
        slug,
      };

      if (input.shouldAssignAdmin && ctx.userId !== OMNI_USER_ID) {
        data.organizationMemberships = {
          create: {
            userId: ctx.userId,
            role: UserRole.Admin,
          },
        };
      }

      const org = await prisma.organization.create({ data });

      if (input.shouldCreateResourceOwnerSlug) {
        await prisma.resourceOwnerSlug.create({
          data: {
            slug,
            resourceOwnerId: org.id,
            resourceOwnerType: ResourceOwnerType.Organization,
          },
        });
      }

      trackEvent({
        eventName: 'Created Org',
        userId: ctx.userId,
        orgId: org.id,
        properties: {},
      });

      return org;
    }),
  update: publicProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!hasOrgAdminPermission(ctx))
        throw new TRPCError({ code: 'UNAUTHORIZED' });

      return prisma.organization.update({
        where: {
          id: ctx.orgId,
        },
        data: input,
      });
    }),
  updateMember: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        data: z.object({
          role: z.nativeEnum(UserRole),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!hasOrgAdminPermission(ctx))
        throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (input.userId === ctx.userId) {
        throw new TRPCError({
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
    }),
  removeMember: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!hasOrgAdminPermission(ctx))
        throw new TRPCError({ code: 'UNAUTHORIZED' });

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
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot remove the last admin',
          });
        }
      }

      const orgMem = await prisma.organizationMembership.delete({
        where: {
          organizationId_userId: {
            organizationId: ctx.orgId!,
            userId: input.userId,
          },
        },
      });

      return !!orgMem;
    }),
  inviteMember: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!hasOrgAdminPermission(ctx))
        throw new TRPCError({ code: 'UNAUTHORIZED' });

      const existingUser = await prisma.user.findFirst({
        where: {
          email: input.email,
        },
        include: {
          organizationMemberships: true,
        },
      });

      if (existingUser) {
        const existingMembership = existingUser.organizationMemberships.find(
          (m) => m.organizationId === ctx.orgId,
        );

        if (existingMembership) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User is already a member of this organization',
          });
        }
      }

      const signInOrSignUp = existingUser ? 'signin' : 'signup';

      const invite = await prisma.organizationInvitation.create({
        data: {
          email: input.email,
          organizationId: ctx.orgId!,
          role: input.role,
          token: crypto.randomBytes(4).toString('hex'),
          redirectUrl: `${getZipperDotDevUrl().origin}/${signInOrSignUp}`,
        },
      });

      const org = await prisma.organization.findUnique({
        where: {
          id: ctx.orgId!,
        },
      });

      if (invite && org) {
        const callbackUrl = `${
          getZipperDotDevUrl().origin
        }/auth/accept-invitation/${invite.token}`;
        sendInvitationEmail({
          email: input.email,
          callbackUrl,
          resourceToJoinName: org.name,
        });
      }

      return invite;
    }),
  revokeInvitation: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!hasOrgAdminPermission(ctx))
        throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        const invite = await prisma.organizationInvitation.delete({
          where: {
            organizationId_email: {
              organizationId: ctx.orgId!,
              email: input.email,
            },
          },
        });
        return !!invite;
      } catch (e) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }
    }),
  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().optional(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.token && !input.organizationId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Must provide either token or organizationId',
        });
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const user = await prisma.user.findUnique({
        where: {
          id: ctx.userId,
        },
        select: {
          email: true,
        },
      });

      const invite = await prisma.organizationInvitation.findFirst({
        where: {
          OR: [
            {
              token: input.token,
              email: user?.email,
            },

            {
              organizationId: input.organizationId,
              email: user?.email,
            },
          ],
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      const existingMembership = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: invite.organizationId,
          userId: ctx.userId,
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is already a member of this organization',
        });
      }

      await prisma.organizationMembership.create({
        data: {
          organizationId: invite.organizationId,
          userId: ctx.userId,
          role: invite.role,
        },
      });

      await prisma.organizationInvitation.delete({
        where: {
          organizationId_email: {
            organizationId: invite.organizationId,
            email: invite.email,
          },
        },
      });

      return invite.organizationId;
    }),
});
