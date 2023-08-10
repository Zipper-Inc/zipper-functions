import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import {
  hasAppReadPermission,
  hasAppEditPermission,
} from '../utils/authz.utils';

import s3Client from '../s3';
import JSZip from 'jszip';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { captureException } from '@sentry/nextjs';

const defaultSelect = Prisma.validator<Prisma.VersionSelect>()({
  appId: true,
  hash: true,
  isPublished: true,
  createdAt: true,
  userId: true,
});

async function getVersionCode({
  appId,
  version,
}: {
  appId: string;
  version: string;
}) {
  const zipFile = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_APPLET_SRC_BUCKET_NAME,
      Key: `${appId}/${version}.zip`,
    }),
  );

  if (!zipFile || !zipFile.Body) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }
  const versionScripts: Prisma.ScriptCreateManyInput[] = [];
  const versionZip = new JSZip();

  await versionZip.loadAsync(zipFile.Body.transformToByteArray());

  const promises: Promise<string | void>[] = [];

  // you now have every files contained in the loaded zip
  versionZip.forEach(async function (relativePath, zipEntry) {
    promises.push(
      zipEntry.async('string').then(function (content) {
        const jsonContent = JSON.parse(content);

        versionScripts.push({
          appId,
          filename: jsonContent.filename,
          code: jsonContent.code,
          hash: jsonContent.hash,
          isRunnable: jsonContent.isRunnable,
          createdAt: jsonContent.createdAt,
          updatedAt: jsonContent.updatedAt,
          name: jsonContent.name,
        });
      }),
    );
  });

  await Promise.all(promises);

  return versionScripts;
}

export const versionRouter = createRouter()
  .query('byVersion', {
    input: z.object({
      appId: z.string(),
      version: z.string().min(7),
    }),
    async resolve({ ctx, input }) {
      await hasAppReadPermission({
        ctx,
        appId: input.appId,
      });

      const app = await prisma.app.findUnique({
        where: {
          id: input.appId,
        },
        select: {
          playgroundVersionHash: true,
          publishedVersionHash: true,
        },
      });

      const version = await prisma.version.findFirstOrThrow({
        where: {
          appId: input.appId,
          hash: { startsWith: input.version },
        },
        select: defaultSelect,
      });

      const user = version.userId
        ? await prisma.user.findUnique({
            where: {
              id: version.userId,
            },
            select: {
              id: true,
              name: true,
              image: true,
              slug: true,
            },
          })
        : undefined;

      const versionScripts = await getVersionCode({
        appId: input.appId,
        version: input.version,
      });

      return {
        ...version,
        code: versionScripts,
        user,
        isCurrentlyPlayground: version.hash === app?.playgroundVersionHash,
        isCurrentlyPublished: version.hash === app?.publishedVersionHash,
      };
    },
  })
  // read
  .query('all', {
    input: z.object({
      appId: z.string(),
      limit: z.number().optional(),
    }),
    async resolve({ ctx, input }) {
      await hasAppReadPermission({
        ctx,
        appId: input.appId,
      });

      const app = await prisma.app.findUnique({
        where: {
          id: input.appId,
        },
        select: {
          playgroundVersionHash: true,
          publishedVersionHash: true,
        },
      });

      const versions = await prisma.version.findMany({
        where: {
          appId: input.appId,
        },
        select: defaultSelect,
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
      });

      const users = await prisma.user.findMany({
        where: {
          id: {
            in: versions
              .filter((v) => !!v.userId)
              .map((v) => v.userId) as string[],
          },
        },
      });

      return versions.map((v) => {
        return {
          ...v,
          user: users.find((u) => u.id === v.userId),
          isCurrentlyPlayground: v.hash === app?.playgroundVersionHash,
          isCurrentlyPublished: v.hash === app?.publishedVersionHash,
        };
      });
    },
  })
  .mutation('promote', {
    input: z.object({
      version: z.string().min(7),
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({ ctx, appId: input.appId });

      const version = await prisma.version.findFirstOrThrow({
        where: {
          appId: input.appId,
          hash: { startsWith: input.version },
        },
      });

      await prisma.version.update({
        where: {
          appId_hash: {
            appId: input.appId,
            hash: version.hash,
          },
        },
        data: {
          isPublished: true,
        },
      });

      await prisma.app.update({
        where: {
          id: input.appId,
        },
        data: {
          publishedVersionHash: version.hash,
        },
      });
    },
  })
  .mutation('restore', {
    input: z.object({
      appId: z.string(),
      version: z.string().min(7),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({ ctx, appId: input.appId });

      const version = await prisma.version.findFirstOrThrow({
        where: {
          appId: input.appId,
          hash: { startsWith: input.version },
        },
      });

      const versionScripts = await getVersionCode({
        appId: input.appId,
        version: input.version,
      });

      try {
        await prisma.scriptMain.delete({
          where: {
            appId: input.appId,
          },
        });
      } catch (e) {
        captureException(e);
      }

      try {
        await prisma.script.deleteMany({
          where: {
            appId: input.appId,
          },
        });
      } catch (e) {
        captureException(e);
      }

      await prisma.script.createMany({
        data: versionScripts,
      });

      const scriptMain = await prisma.script.findFirst({
        where: {
          appId: input.appId,
          filename: 'main.ts',
        },
      });

      await prisma.scriptMain.create({
        data: {
          appId: input.appId,
          scriptId: scriptMain!.id,
        },
      });

      await prisma.app.update({
        where: {
          id: input.appId,
        },
        data: {
          playgroundVersionHash: version.hash,
        },
      });
    },
  });
