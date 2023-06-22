import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import denyList from '../utils/slugDenyList';
import { ResourceOwnerType } from '@zipper/types';

const defaultSelect = Prisma.validator<Prisma.ResourceOwnerSlugSelect>()({
  slug: true,
});

export const resourceOwnerSlugRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      slug: z.string().min(3).max(50),
      resourceOwnerId: z.string(),
      resourceOwnerType: z.number(),
    }),
    async resolve({ input }) {
      const deniedSlug = denyList.find((d) => d === input.slug);
      if (deniedSlug)
        return new TRPCError({
          message: 'Invalid slug',
          code: 'INTERNAL_SERVER_ERROR',
        });
      return prisma.resourceOwnerSlug.create({
        data: { ...input },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('find', {
    input: z.object({
      slug: z.string().min(3),
    }),
    async resolve({ input }) {
      const deniedSlug = denyList.find((d) => d === input.slug);
      if (deniedSlug)
        throw new TRPCError({
          message: 'Denied slug',
          code: 'INTERNAL_SERVER_ERROR',
        });
      return prisma.resourceOwnerSlug.findFirst({
        where: {
          slug: input.slug,
        },
        select: defaultSelect,
      });
    },
  })
  .query('getName', {
    input: z.object({
      slug: z.string(),
    }),
    async resolve({ input }) {
      const resourceOwner = await prisma.resourceOwnerSlug.findUnique({
        where: {
          slug: input.slug,
        },
        select: {
          resourceOwnerId: true,
          resourceOwnerType: true,
        },
      });

      if (!resourceOwner) return undefined;

      if (resourceOwner.resourceOwnerType === ResourceOwnerType.Organization) {
        const organization = await prisma.organization.findUnique({
          where: {
            id: resourceOwner.resourceOwnerId!,
          },
          select: {
            name: true,
          },
        });
        return organization?.name;
      }

      if (resourceOwner.resourceOwnerType === ResourceOwnerType.User) {
        const user = await prisma.user.findUnique({
          where: {
            id: resourceOwner.resourceOwnerId!,
          },
          select: {
            name: true,
          },
        });
        return user?.name;
      }

      return undefined;
    },
  })
  .query('findByOrganizationId', {
    input: z.object({
      organizationId: z.string(),
    }),
    async resolve({ input }) {
      return prisma.resourceOwnerSlug.findFirst({
        where: {
          resourceOwnerId: input.organizationId,
          resourceOwnerType: ResourceOwnerType.Organization,
        },
        select: defaultSelect,
      });
    },
  });
