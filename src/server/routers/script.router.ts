import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import slugify from '~/utils/slugify';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';

const defaultSelect = Prisma.validator<Prisma.ScriptSelect>()({
  id: true,
  name: true,
  description: true,
  appId: true,
  code: true,
  createdAt: true,
  updatedAt: true,
});

export const scriptRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      name: z.string().min(3).max(255),
      description: z.string().optional(),
      appId: z.string().uuid(),
      code: z.string(),
      order: z.number(),
    }),
    async resolve({ ctx, input }) {
      const { appId, ...data } = input;
      await hasAppEditPermission({ superTokenId: ctx.superTokenId, appId });

      return prisma.script.create({
        data: {
          ...data,
          app: {
            connect: { id: appId },
          },
          filename: `${slugify(data.name)}.ts`,
        },
        select: defaultSelect,
      });
    },
  })
  .query('byAppId', {
    input: z.object({
      appId: z.string().uuid(),
    }),
    async resolve({ input }) {
      return prisma.script.findMany({
        where: {
          appId: input.appId,
        },
        orderBy: { order: 'asc' },
        select: defaultSelect,
      });
    },
  })
  .query('byId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      return prisma.script.findFirstOrThrow({
        where: {
          id: input.id,
        },
        select: defaultSelect,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string().uuid(),
      appId: z.string().uuid(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        superTokenId: ctx.superTokenId,
        appId: input.appId,
      });

      await prisma.script.deleteMany({
        where: {
          id: input.id,
        },
      });

      return {
        id: input.id,
      };
    },
  });
