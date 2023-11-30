import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { hasAppEditPermission } from '../utils/authz.utils';
import { encryptToBase64 } from '@zipper/utils';
import { createTRPCRouter, publicProcedure } from '../root';
import hash from 'object-hash';
import { buildAndStoreNewAppVersion } from './app.router';

const defaultSelect = Prisma.validator<Prisma.SecretSelect>()({
  id: true,
  appId: true,
  key: true,
  encryptedValue: true,
});

const updateAppSecretsHash = async (appId: string, userId?: string) => {
  const secrets = await prisma.secret.findMany({
    where: {
      appId,
    },
    orderBy: {
      key: 'asc',
    },
    select: {
      key: true,
      encryptedValue: true,
    },
  });
  const secretsHash = hash(secrets);

  await prisma.app.update({
    where: {
      id: appId,
    },
    data: {
      secretsHash,
    },
  });

  await buildAndStoreNewAppVersion(appId, { userId });
};

export async function upsertSecret(
  input: {
    key: string;
    appId: string;
    value: string;
  },
  { userId }: { userId?: string },
) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set');
  }

  const { appId, key, value } = input;

  const encryptedValue = encryptToBase64(value, process.env.ENCRYPTION_KEY);

  const secret = await prisma.secret.upsert({
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

  await updateAppSecretsHash(appId, userId);

  return secret;
}

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

      return upsertSecret(input, ctx);
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

        await updateAppSecretsHash(input.appId, ctx.userId);

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

        await updateAppSecretsHash(input.appId, ctx.userId);

        return {
          key: input.key,
        };
      }
    }),
});
