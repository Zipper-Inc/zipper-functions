import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { hasAppEditPermission } from '../utils/authz.utils';
import { encryptToBase64 } from '@zipper/utils';
import { createTRPCRouter, publicProcedure } from '../root';

const defaultSelect = Prisma.validator<Prisma.SecretSelect>()({
  id: true,
  appId: true,
  key: true,
  encryptedValue: true,
});

export const secretRouter = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });
      if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY not set');
      }

      const { appId, key, value } = input;

      const encryptedValue = encryptToBase64(value, process.env.ENCRYPTION_KEY);

      return prisma.secret.upsert({
        where: {
          appId_key: {
            appId,
            key,
          },
        },
        create: {
          appId,
          key,
          encryptedValue,
        },
        update: {
          encryptedValue,
        },
        select: defaultSelect,
      });
    }),
  get: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        key: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      return prisma.secret.findFirst({
        where: {
          appId: input.appId,
          key: input.key,
        },
        select: defaultSelect,
      });
    }),
  all: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });
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
    }),
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        key: z.string().optional(),
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });
      if (input.id) {
        await prisma.secret.deleteMany({
          where: {
            id: input.id,
            appId: input.appId,
          },
        });

        return {
          id: input.id,
        };
      }

      if (input.key) {
        await prisma.secret.deleteMany({
          where: {
            key: input.key,
            appId: input.appId,
          },
        });

        return {
          key: input.key,
        };
      }
    }),
});
