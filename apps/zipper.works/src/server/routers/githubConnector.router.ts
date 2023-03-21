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
import { AppConnectorUserAuth } from '@prisma/client';

type GithubAuthTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

type GithubCheckTokenResponse = {
  id: number;
  url: string;
  scopes: string[] | null;
  token: string;
  token_last_eight: string;
  hashed_token: string;
  app: {
    url: string;
    name: string;
    client_id: string;
  };
  note: string;
  note_url: string;
  updated_at: string;
  created_at: string;
  fingerprint: string;
  expires_at: string;
  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
};

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
    async resolve({ ctx, input }) {
      if (!hasAppEditPermission({ ctx, appId: input.appId })) {
        new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await prisma.appConnector.update({
        where: {
          appId_type: {
            appId: input.appId,
            type: 'github',
          },
        },
        data: {
          metadata: undefined,
        },
      });

      const secret = await prisma.secret.delete({
        where: {
          appId_key: {
            appId: input.appId,
            key: 'GITHUB_TOKEN',
          },
        },
      });

      await fetch('https://slack.com/api/auth.revoke', {
        method: 'POST',
        body: new URLSearchParams({
          token: decryptFromBase64(
            secret.encryptedValue,
            process.env.ENCRYPTION_KEY!,
          ),
        }),
      });

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

      await fetch('https://slack.com/api/auth.revoke', {
        method: 'POST',
        body: new URLSearchParams({
          token: decryptFromBase64(
            userAuth.encryptedAccessToken,
            process.env.ENCRYPTION_KEY!,
          ),
        }),
      });

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
          // 'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID!,
          client_secret: process.env.GITHUB_CLIENT_SECRET!,
          code: input.code,
          state: input.state,
          accept: 'json',
        }),
      });

      const json = (await res.json()) as GithubAuthTokenResponse;

      if (!json.access_token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
        });
      }

      let appConnectorUserAuth: AppConnectorUserAuth | undefined = undefined;

      const userIdOrTempId =
        userId || ctx.userId || (ctx.req?.cookies as any)['__zipper_user_id'];
      if (appId && json.scope && userIdOrTempId) {
        const userInfoRes = await fetch(
          `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
            },
            body: new URLSearchParams({
              access_token: (json as GithubAuthTokenResponse).access_token,
            }),
          },
        );
        const userInfoJson =
          (await userInfoRes.json()) as GithubCheckTokenResponse;
        if (userInfoJson.user) {
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
              metadata: userInfoJson,
              encryptedAccessToken: encryptToBase64(
                json.access_token,
                process.env.ENCRYPTION_KEY!,
              ),
            },
            update: {
              metadata: { id: userInfoJson.user.id, ...json },
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
          metadata: json,
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
