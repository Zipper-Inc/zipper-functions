import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { encryptToBase64 } from '../utils/crypto.utils';

const defaultSelect = Prisma.validator<Prisma.SecretSelect>()({
  id: true,
  appId: true,
  key: true,
  encryptedValue: true,
});

export const secretRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      appId: z.string(),
      key: z.string(),
      value: z.string(),
    }),
    async resolve({ input }) {
      if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY not set');
      }

      const { appId, key, value } = input;

      const encryptedValue = encryptToBase64(value, process.env.ENCRYPTION_KEY);

      return prisma.secret.create({
        data: {
          appId,
          key,
          encryptedValue,
        },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('all', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ input }) {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.secret.findMany({
        where: {
          appId: input.appId,
        },
        select: defaultSelect,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string(),
      appId: z.string(),
    }),
    async resolve({ input }) {
      await prisma.secret.deleteMany({
        where: {
          id: input.id,
          appId: input.appId,
        },
      });

      return {
        id: input.id,
      };
    },
  });
