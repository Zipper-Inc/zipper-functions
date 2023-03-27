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
  GithubAuthTokenResponse,
  GithubCheckTokenResponse,
} from '@zipper/types';

const getBase64Credentials = () =>
  Buffer.from(
    `${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`,
  ).toString('base64');

export const githubConnectorRouter = createRouter()
  .query('get', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      if (!hasAppEditPermission({ ctx, appId: input.appId })) {
        new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return prisma.appConnector.findFirst({
        where: {
          appId: input.appId,
          type: 'github',
        },
      });
    },
  })
  .query('getAuthUrl', {
    input: z.object({
      appId: z.string(),
      scopes: z.array(z.string()),
      postInstallationRedirect: z.string().optional(),
      redirectUri: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      if (!hasAppReadPermission({ ctx, appId: input.appId })) {
        new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const { appId, scopes, postInstallationRedirect, redirectUri } = input;
      const state = encryptToHex(
        `${appId}::${postInstallationRedirect || ''}`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
      url.searchParams.set('scope', scopes.join(','));
      url.searchParams.set('state', state);
      if (redirectUri) {
        url.searchParams.set('redirect_uri', redirectUri);
      }

      return {
        url: url.toString(),
      };
    },
  })
  .mutation('delete', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ ctx, input: { appId } }) {
      if (!hasAppEditPermission({ ctx, appId })) {
        new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await prisma.appConnector.update({
        where: {
          appId_type: {
            appId,
            type: 'github',
          },
        },
        data: {
          metadata: Prisma.JsonNull,
        },
      });

      const secret = await prisma.secret.delete({
        where: {
          appId_key: {
            appId,
            key: 'GITHUB_TOKEN',
          },
        },
      });
      const userIdOrTempId =
        ctx.userId || (ctx.req?.cookies as any)['__zipper_user_id'];
      await prisma.appConnectorUserAuth.delete({
        where: {
          appId_connectorType_userIdOrTempId: {
            appId,
            connectorType: 'github',
            userIdOrTempId,
          },
        },
      });

      const token = decryptFromBase64(
        secret.encryptedValue,
        process.env.ENCRYPTION_KEY!,
      );

      const base64Credentials = getBase64Credentials();
      await fetch(
        `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/grant`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${base64Credentials}`,
          },
          method: 'DELETE',
          body: JSON.stringify({
            access_token: token,
          }),
        },
      );

      return true;
    },
  })
  .mutation('deleteUserAuth', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const userIdOrTempId =
        ctx.userId || (ctx.req?.cookies as any)['__zipper_user_id'];

      const { appId } = input;

      const userAuth = await prisma.appConnectorUserAuth.delete({
        where: {
          appId_connectorType_userIdOrTempId: {
            appId,
            connectorType: 'github',
            userIdOrTempId,
          },
        },
      });

      await fetch(
        `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`,
        {
          method: 'DELETE',
          headers: { Authorization: `Basic ${getBase64Credentials()}` },
          body: JSON.stringify({
            access_token: decryptFromBase64(
              userAuth.encryptedAccessToken,
              process.env.ENCRYPTION_KEY!,
            ),
          }),
        },
      );

      return true;
    },
  })
  .mutation('exchangeCodeForToken', {
    input: z.object({
      code: z.string(),
      state: z.string(),
    }),
    async resolve({ ctx, input }) {
      let appId: string | undefined;
      let redirectTo: string | undefined;
      let userId: string | undefined;
      try {
        const decryptedState = decryptFromHex(
          input.state,
          process.env.ENCRYPTION_KEY!,
        );
        [appId, redirectTo, userId] = decryptedState.split('::');
      } catch (e) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID!,
          client_secret: process.env.GITHUB_CLIENT_SECRET!,
          code: input.code,
          state: input.state,
        }),
      });

      const json = (await res.json()) as GithubAuthTokenResponse;

      if (!json.access_token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
        });
      }

      let appConnectorUserAuth: AppConnectorUserAuth | undefined = undefined;
      let metadata: any = json;

      const userIdOrTempId: string =
        userId || ctx.userId || (ctx.req?.cookies as any)['__zipper_user_id'];
      if (appId && json.scope && userIdOrTempId) {
        const base64Credentials = getBase64Credentials();
        const userInfoRes = await fetch(
          `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Basic ${base64Credentials}`,
            },
            body: JSON.stringify({
              access_token: json.access_token,
            }),
          },
        );
        const userInfoJson =
          (await userInfoRes.json()) as GithubCheckTokenResponse;
        if (userInfoJson.user) {
          metadata = userInfoJson;
          appConnectorUserAuth = await prisma.appConnectorUserAuth.upsert({
            where: {
              appId_connectorType_userIdOrTempId: {
                appId,
                connectorType: 'github',
                userIdOrTempId,
              },
            },
            create: {
              appId,
              connectorType: 'github',
              userIdOrTempId,
              metadata: userInfoJson.user,
              encryptedAccessToken: encryptToBase64(
                json.access_token,
                process.env.ENCRYPTION_KEY!,
              ),
            },
            update: {
              metadata: userInfoJson.user,
              encryptedAccessToken: encryptToBase64(
                json.access_token,
                process.env.ENCRYPTION_KEY!,
              ),
            },
          });
        }
      }

      await prisma.appConnector.update({
        where: {
          appId_type: {
            appId: appId!,
            type: 'github',
          },
        },
        data: {
          metadata,
        },
      });

      const encryptedValue = encryptToBase64(
        json.access_token,
        process.env.ENCRYPTION_KEY,
      );

      await prisma.secret.upsert({
        where: {
          appId_key: {
            appId: appId!,
            key: 'GITHUB_TOKEN',
          },
        },
        create: {
          appId,
          key: 'GITHUB_TOKEN',
          encryptedValue,
        },
        update: {
          encryptedValue,
        },
      });

      const app = await prisma.app.findFirstOrThrow({
        where: { id: appId },
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId: app.organizationId || app.createdById,
        },
      });

      return {
        appId,
        app: { ...app, resourceOwner },
        redirectTo,
        appConnectorUserAuth: appConnectorUserAuth || null,
      };
    },
  });
