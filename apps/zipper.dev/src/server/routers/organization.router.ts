import { z } from 'zod';
import { hasOrgAdminPermission } from '../utils/authz.utils';
import { ResourceOwnerType, UserRole } from '@zipper/types';
import * as trpc from '@trpc/server';
import { prisma } from '../prisma';
import crypto from 'crypto';
import { createRouter } from '../createRouter';
import denyList from '../utils/slugDenyList';
import slugify from '~/utils/slugify';
import { Resend } from 'resend';
import { OrgInvitationEmail } from 'emails';
import { hashToken } from 'next-auth/core/lib/utils';
import EmailProvider from 'next-auth/providers/email';
import { authOptions } from '~/pages/api/auth/[...nextauth]';

export const resend = new Resend(process.env.RESEND_API_KEY!);

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

      const org = await prisma.organization.create({
        data: {
          name: input.name,
          slug,
          organizationMemberships: {
            create: {
              userId: ctx.userId,
              role: UserRole.Admin,
            },
          },
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

      const orgMem = await prisma.organizationMembership.delete({
        where: {
          organizationId_userId: {
            organizationId: ctx.orgId!,
            userId: input.userId,
          },
        },
      });

      return !!orgMem;
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
        include: {
          organizationMemberships: true,
        },
      });

      if (existingUser) {
        const existingMembership = existingUser.organizationMemberships.find(
          (m) => m.organizationId === ctx.orgId,
        );

        if (existingMembership) {
          throw new trpc.TRPCError({
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
          redirectUrl: `${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL}/${signInOrSignUp}`,
        },
      });

      const org = await prisma.organization.findUnique({
        where: {
          id: ctx.orgId!,
        },
      });

      if (invite && org) {
        const token = crypto.randomBytes(16).toString('hex');

        const hash = crypto
          .createHash('sha256')
          // Prefer provider specific secret, but use default secret if none specified
          .update(`${token}${process.env.NEXTAUTH_EMAIL_PROVIDER_SECRET}`)
          .digest('hex');

        await prisma.verificationToken.create({
          data: {
            token: hash,
            identifier: input.email,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          },
        });
        await resend.emails.send({
          to: input.email,
          from: 'noreply@zipper.dev',
          subject: `You've been invited to join ${org.name} on Zipper`,
          react: OrgInvitationEmail({
            loginUrl: `${
              process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL
            }/api/auth/callback/email?${new URLSearchParams({
              token: token,
              email: input.email,
              callbackUrl: `${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL}/auth/accept-invitation/${invite.token}`,
            })}`,
            organizationName: org.name,
          }),
        });
      }

      return invite;
    },
  })
  .mutation('revokeInvitation', {
    input: z.object({
      email: z.string().email(),
    }),
    async resolve({ input, ctx }) {
      if (!hasOrgAdminPermission(ctx))
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });

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
        throw new trpc.TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }
    },
  })
  .mutation('acceptInvitation', {
    input: z.object({
      token: z.string(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.userId) throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
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
          token: input.token,
          email: user?.email,
        },
      });

      if (!invite) {
        throw new trpc.TRPCError({
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
        throw new trpc.TRPCError({
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
          token: input.token,
        },
      });

      return invite.organizationId;
    },
  });
