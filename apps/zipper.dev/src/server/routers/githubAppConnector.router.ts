/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '../createRouter';
import { prisma } from '../prisma';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import { decryptFromHex, encryptToBase64, encryptToHex } from '@zipper/utils';
import { Prisma } from '@prisma/client';

export const githubAppConnectorRouter = createRouter()
  .query('get', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppReadPermission({ ctx, appId: input.appId });

      return prisma.appConnector.findFirst({
        where: {
          appId: input.appId,
          type: 'github-app',
        },
      });
    },
  })
  .query('getStateValue', {
    input: z.object({
      appId: z.string(),
      postInstallationRedirect: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      await hasAppReadPermission({ ctx, appId: input.appId });

      const { appId, postInstallationRedirect } = input;

      return encryptToHex(
        `${appId}::${postInstallationRedirect || ''}`,
        process.env.ENCRYPTION_KEY || '',
      );
    },
  })
  .mutation('delete', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ ctx, input: { appId } }) {
      await hasAppEditPermission({ ctx, appId });

      await prisma.appConnector.update({
        where: {
          appId_type: {
            appId,
            type: 'github-app',
          },
        },
        data: {
          metadata: Prisma.DbNull,
        },
      });

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_APP_ID',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_WEBHOOK_SECRET',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_CLIENT_SECRET',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_PEM',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      return true;
    },
  })
  .mutation('exchangeManifestCode', {
    input: z.object({
      code: z.string(),
      state: z.string(),
    }),
    async resolve({ ctx, input }) {
      let appId: string | undefined;
      let redirectTo: string | undefined;
      try {
        const decryptedState = decryptFromHex(
          input.state,
          process.env.ENCRYPTION_KEY!,
        );
        [appId, redirectTo] = decryptedState.split('::');
      } catch (e) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      if (!appId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const res = await fetch(
        `https://api.github.com/app-manifests/${input.code}/conversions`,
        {
          method: 'post',
        },
      );

      const json = await res.json();

      if (json.message) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: json.message });
      }

      const secretKeys = ['webhook_secret', 'pem', 'client_secret'];

      const secrets = secretKeys.reduce((acc, key) => {
        let valueToStore = json[key];
        if (!valueToStore) return acc;
        if (key === 'pem') {
          valueToStore = json[key].toString('base64');
        }

        const secretKey = `GITHUB_${key.toUpperCase()}`;
        const secretValue = encryptToBase64(
          valueToStore,
          process.env.ENCRYPTION_KEY!,
        );
        acc.push({ key: secretKey, value: secretValue });
        return acc;
      }, [] as Record<'key' | 'value', string>[]);

      await Promise.all(
        secrets.map((secret) =>
          prisma.secret.upsert({
            where: {
              appId_key: {
                appId: appId!,
                key: secret.key,
              },
            },
            create: {
              appId,
              key: secret.key,
              encryptedValue: secret.value,
            },
            update: {
              encryptedValue: secret.value,
            },
          }),
        ),
      );

      secretKeys.forEach((key) => {
        delete json[key];
      });

      // useful to have the app id because it's required to make API calls
      await prisma.secret.upsert({
        where: {
          appId_key: {
            appId: appId!,
            key: 'GITHUB_APP_ID',
          },
        },
        create: {
          appId,
          key: 'GITHUB_APP_ID',
          encryptedValue: encryptToBase64(
            json.id.toString(),
            process.env.ENCRYPTION_KEY!,
          ),
        },
        update: {
          encryptedValue: encryptToBase64(
            json.id.toString(),
            process.env.ENCRYPTION_KEY!,
          ),
        },
      });

      const connector = await prisma.appConnector.update({
        where: {
          appId_type: {
            appId,
            type: 'github-app',
          },
        },
        data: {
          metadata: json,
        },
        include: {
          app: true,
        },
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId:
            connector.app.organizationId || connector.app.createdById,
        },
      });

      return {
        app: { ...connector.app, resourceOwner },
        redirectTo,
      };
    },
  });
