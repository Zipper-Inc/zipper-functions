import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import denyList from '../utils/slugDenyList';
import { ResourceOwnerType } from '@zipper/types';
import clerkClient from '@clerk/clerk-sdk-node';
import slugify from '~/utils/slugify';

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
  })
  .mutation('validateAndCreateUserSlug', {
    input: z.object({
      clerkUsername: z.string().transform((s) => s.trim().toLowerCase()),
      id: z.string(),
    }),
    async resolve({ input }) {
      const userSlugExists = await prisma.resourceOwnerSlug.findFirst({
        where: {
          resourceOwnerId: input.id,
          resourceOwnerType: ResourceOwnerType.User,
          slug: input.clerkUsername,
        },
      });

      if (userSlugExists) {
        return userSlugExists;
      }

      return prisma.resourceOwnerSlug.create({
        data: {
          resourceOwnerId: input.id,
          resourceOwnerType: ResourceOwnerType.User,
          slug: input.clerkUsername,
        },
      });
    },
  })
  .query('lookupOnClerk', {
    input: z.object({
      slug: z.string(),
    }),
    async resolve({ input }) {
      const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
        where: { slug: input.slug },
      });

      if (!resourceOwner || !resourceOwner.resourceOwnerId) return;

      if (resourceOwner.resourceOwnerType === ResourceOwnerType.User) {
        const clerkUser = await clerkClient.users.getUser(
          resourceOwner.resourceOwnerId,
        );

        if (clerkUser) {
          const name =
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.publicMetadata.identifier || clerkUser.username;

          return { name };
        }
      }

      if (resourceOwner.resourceOwnerType === ResourceOwnerType.Organization) {
        const clerkOrg = await clerkClient.organizations.getOrganization({
          organizationId: resourceOwner.resourceOwnerId,
        });

        if (clerkOrg) {
          return { name: clerkOrg.name };
        }
      }

      return;
    },
  })
  .query('lookupUserOnClerk', {
    input: z.object({
      slug: z.string(),
    }),
    async resolve({ input }) {
      const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
        where: { slug: input.slug },
      });

      if (!resourceOwner || !resourceOwner.resourceOwnerId) return;

      return clerkClient.users.getUser(resourceOwner.resourceOwnerId);
    },
  })
  .mutation('createGeneratedUserSlug', {
    input: z.object({
      id: z.string(),
      firstName: z
        .string()
        .transform((s) => s.trim().toLowerCase())
        .optional(),
      lastName: z
        .string()
        .transform((s) => s.trim().toLowerCase())
        .optional(),
      email: z
        .string()
        .email()
        .transform((s) => s.trim().toLowerCase())
        .optional(),
      clerkUsername: z.string().optional(),
    }),
    async resolve({ input }) {
      const { firstName, lastName, email, clerkUsername } = input;
      let possibleSlugs: string[] = clerkUsername ? [clerkUsername] : [];
      if (email) {
        const emailParts = email.split('@');
        if (emailParts.length >= 2) possibleSlugs.push(emailParts[0] as string);
      }
      if (firstName && lastName) {
        possibleSlugs.push(`${firstName}${lastName[0]}`);
        possibleSlugs.push(`${firstName[0]}${lastName}`);
        possibleSlugs.push(`${firstName}-${lastName}`);

        possibleSlugs.push(
          `${firstName}${lastName[0]}${Math.floor(Math.random() * 100)}`,
        );
        possibleSlugs.push(
          `${firstName[0]}${lastName}${Math.floor(Math.random() * 100)}`,
        );
        possibleSlugs.push(
          `${firstName}-${lastName}${Math.floor(Math.random() * 100)}`,
        );
      }

      possibleSlugs = possibleSlugs.map((s) => slugify(s));

      const existingResourceOwnerSlugs =
        await prisma.resourceOwnerSlug.findMany({
          where: { slug: { in: possibleSlugs } },
        });

      const existingSlugs = existingResourceOwnerSlugs.map((s) => s.slug);

      const validSlugs = possibleSlugs.filter((s) => {
        return !existingSlugs.includes(s);
      });

      if (validSlugs.length > 0) {
        const newSlug = await prisma.resourceOwnerSlug.create({
          data: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            slug: validSlugs[0]!,
            resourceOwnerType: ResourceOwnerType.User,
            resourceOwnerId: input.id,
          },
          select: defaultSelect,
        });

        try {
          clerkClient.users.updateUser(input.id, {
            username: newSlug.slug,
            publicMetadata: { username: newSlug.slug },
          });
        } catch (error) {
          console.error(error);
        }

        return newSlug;
      }

      throw new TRPCError({
        message: 'Unique username could not be generated. Try again.',
        code: 'INTERNAL_SERVER_ERROR',
      });
    },
  });
