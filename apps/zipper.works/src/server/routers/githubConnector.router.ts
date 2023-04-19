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

const getBase64Credentials = ({
  clientId,
  clientSecret,
}: {
  clientId?: string;
  clientSecret?: string;
} = {}) =>
  Buffer.from(
    `${clientId || process.env.GITHUB_CLIENT_ID}:${
      clientSecret || process.env.GITHUB_CLIENT_SECRET
    }`,
  ).toString('base64');

export const githubConnectorRouter = createRouter()
  .query('get', {
    input: z.object({
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppReadPermission({ ctx, appId: input.appId });

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
      await hasAppReadPermission({ ctx, appId: input.appId });

      const { appId, scopes, postInstallationRedirect, redirectUri } = input;

      const connector = await prisma.appConnector.findUnique({
        where: { appId_type: { appId, type: 'github' } },
      });

      const state = encryptToHex(
        `${appId}::${postInstallationRedirect || ''}`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set(
        'client_id',
        connector?.clientId || process.env.GITHUB_CLIENT_ID!,
      );
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
      await hasAppEditPermission({ ctx, appId });

      await prisma.appConnector.update({
        where: {
          appId_type: {
            appId,
            type: 'github',
          },
        },
        data: {
          metadata: Prisma.DbNull,
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

      const secret = await prisma.secret.findUnique({
        where: {
          appId_key: {
            appId,
            key: 'GITHUB_TOKEN',
          },
        },
      });
      const userAuthToken = decryptFromBase64(
        userAuth.encryptedAccessToken,
        process.env.ENCRYPTION_KEY!,
      );
      if (secret) {
        const secretToken = decryptFromBase64(
          secret?.encryptedValue,
          process.env.ENCRYPTION_KEY!,
        );
        // TODO: look at this from a security standpoint
        // Revoke the user token if differs with the secret token
        if (secretToken !== userAuthToken) {
          await fetch(
            `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`,
            {
              method: 'DELETE',
              headers: { Authorization: `Basic ${getBase64Credentials()}` },
              body: JSON.stringify({
                access_token: userAuthToken,
              }),
            },
          );
        }
      }

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

      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: connector.clientId || process.env.GITHUB_CLIENT_ID!,
          client_secret: connector.app.secrets[0]
            ? decryptFromBase64(
                connector.app.secrets[0].encryptedValue,
                process.env.ENCRYPTION_KEY!,
              )
            : process.env.GITHUB_CLIENT_SECRET!,
          code: input.code,
          state: input.state,
        }),
      });

      const json = (await res.json()) as GitHubAuthTokenResponse;

      if (!json.access_token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
        });
      }

      let appConnectorUserAuth: AppConnectorUserAuth | undefined = undefined;
      let metadata: any = filterTokenFields(json);

      const userIdOrTempId: string =
        userId || ctx.userId || (ctx.req?.cookies as any)['__zipper_user_id'];
      if (appId && json.access_token && userIdOrTempId) {
        const githubClientId =
          connector.clientId || process.env.GITHUB_CLIENT_ID;

        const githubClientSecret = connector.app.secrets.find(
          (s) => s.key === 'GITHUB_CLIENT_SECRET',
        );

        const clientSecret = githubClientSecret?.encryptedValue
          ? decryptFromBase64(
              githubClientSecret?.encryptedValue,
              process.env.ENCRYPTION_KEY!,
            )
          : undefined;

        const base64Credentials = getBase64Credentials({
          clientId: githubClientId,
          clientSecret,
        });

        const userInfoRes = await fetch(
          `https://api.github.com/applications/${githubClientId}/token`,
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
          (await userInfoRes.json()) as GitHubCheckTokenResponse;

        if (userInfoJson.user) {
          metadata = filterTokenFields(userInfoJson);
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
              metadata: metadata.user,
              encryptedAccessToken: encryptToBase64(
                userInfoJson.token,
                process.env.ENCRYPTION_KEY!,
              ),
            },
            update: {
              metadata: metadata.user,
              encryptedAccessToken: encryptToBase64(
                userInfoJson.token,
                process.env.ENCRYPTION_KEY!,
              ),
            },
          });
        }
      }

      // Only update connector metadata if previously null and create the GITHUB_TOKEN secret
      if (!connector.metadata) {
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
      }

      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId:
            connector.app.organizationId || connector.app.createdById,
        },
      });

      return {
        appId,
        app: { ...connector.app, resourceOwner },
        redirectTo,
        appConnectorUserAuth: appConnectorUserAuth || null,
      };
    },
  });
