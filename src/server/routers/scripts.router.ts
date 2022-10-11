import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { createScriptHash } from '../utils/scripts.utils';

const defaultSelect = Prisma.validator<Prisma.ScriptSelect>()({
  hash: true,
  name: true,
  description: true,
  appId: true,
  code: true,
  createdAt: true,
});

export const scriptRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      name: z.string().min(3).max(255),
      description: z.string().optional(),
      appId: z.string().uuid(),
      code: z.string(),
    }),
    async resolve({ input }) {
      const { appId, ...data } = input;
      return prisma.script.create({
        data: {
          ...data,
          hash: await createScriptHash(input),
          app: {
            connect: { id: appId },
          },
          filename: data.name,
        },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('all', {
    async resolve() {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.script.findMany({
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
        select: defaultSelect,
      });
    },
  })
  .query('byHash', {
    input: z.object({
      hash: z.string(),
    }),
    async resolve({ input }) {
      return prisma.script.findFirstOrThrow({
        where: {
          hash: input.hash,
        },
        select: defaultSelect,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      hash: z.string(),
    }),
    async resolve({ input }) {
      await prisma.script.deleteMany({
        where: {
          hash: input.hash,
        },
      });

      return {
        hash: input.hash,
      };
    },
  });
