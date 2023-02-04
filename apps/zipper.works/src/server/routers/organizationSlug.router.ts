import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import denyList from '../utils/slugDenyList';

const defaultSelect = Prisma.validator<Prisma.OrganizationSlugSelect>()({
  slug: true,
});

export const organizationSlugRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      slug: z.string().min(3).max(50),
      organizationId: z.string(),
    }),
    async resolve({ input }) {
      const deniedSlug = denyList.find((d) => d === input.slug);
      if (deniedSlug)
        return new TRPCError({
          message: 'Invalid slug',
          code: 'INTERNAL_SERVER_ERROR',
        });
      return prisma.organizationSlug.create({
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
      if (deniedSlug) return deniedSlug;
      return prisma.organizationSlug.findFirst({
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
      return prisma.organizationSlug.findFirst({
        where: {
          organizationId: input.organizationId,
        },
        select: defaultSelect,
      });
    },
  });
