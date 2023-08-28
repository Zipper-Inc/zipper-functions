/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '../createRouter';
import { prisma } from '../prisma';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import {
  decryptFromBase64,
  decryptFromHex,
  encryptToBase64,
  encryptToHex,
} from '@zipper/utils';
import fetch from 'node-fetch';
import { AppConnectorUserAuth, Prisma } from '@prisma/client';
import {
  GitHubAuthTokenResponse,
  GitHubCheckTokenResponse,
} from '@zipper/types';
import { filterTokenFields } from '~/server/utils/json';

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
          type: 'githubApp',
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
            type: 'githubApp',
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
              key: 'GITHUB_PEM_BASE64',
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

      const connector = await prisma.appConnector.findUniqueOrThrow({
        where: {
          appId_type: {
            appId,
            type: 'github',
          },
        },
        include: {
          app: {
            include: {
              secrets: {
                where: { key: 'GITHUB_CLIENT_SECRET' },
              },
            },
          },
        },
      });
      //save secrets
    },
  });
