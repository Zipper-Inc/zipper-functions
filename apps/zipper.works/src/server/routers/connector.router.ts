/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '../createRouter';
import { prisma } from '../prisma';
import { hasAppEditPermission } from '../utils/authz.utils';
import {
  decryptFromBase64,
  decryptFromHex,
  encryptToBase64,
  encryptToHex,
} from '../utils/crypto.utils';
import fetch from 'node-fetch';
import { AppConnectorUserAuth } from '@prisma/client';

export const connectorRouter = createRouter()
  .query('slack.get', {
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
          type: 'slack',
        },
      });
    },
  })
  .query('slack.getAuthUrl', {
    input: z.object({
      appId: z.string(),
      scopes: z.object({
        bot: z.array(z.string()),
        user: z.array(z.string()),
      }),
      redirectTo: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      if (!hasAppEditPermission({ ctx, appId: input.appId })) {
        new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const { appId, scopes, redirectTo } = input;
      const state = encryptToHex(
        `${appId}::${redirectTo || ''}`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://slack.com/oauth/v2/authorize');
      url.searchParams.set(
        'client_id',
        process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
      );
      url.searchParams.set('scope', scopes.bot.join(','));
      url.searchParams.set('user_scope', scopes.user.join(','));
      url.searchParams.set('state', state);

      return {
        url: url.toString(),
      };
    },
  })
  .mutation('slack.delete', {
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
            type: 'slack',
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
            key: 'SLACK_BOT_TOKEN',
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
  .mutation('slack.deleteUserAuth', {
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
            connectorType: 'slack',
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
  .mutation('slack.exchangeCodeForToken', {
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

      const res = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code: input.code,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: json.error,
        });
      }

      const jsonWithoutTokens = JSON.parse(
        JSON.stringify(json, (k, v) => (k.includes('token') ? undefined : v)),
      );

      let appConnectorUserAuth: AppConnectorUserAuth | undefined = undefined;

      const userIdOrTempId =
        ctx.userId || (ctx.req?.cookies as any)['__zipper_user_id'];
      if (appId && json.authed_user.scope && userIdOrTempId) {
        const userInfoRes = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: json.authed_user.access_token,
          }),
        });
        const userInfoJson = await userInfoRes.json();
        if (userInfoJson.ok) {
          appConnectorUserAuth = await prisma.appConnectorUserAuth.upsert({
            where: {
              appId_connectorType_userIdOrTempId: {
                appId,
                connectorType: 'slack',
                userIdOrTempId,
              },
            },
            create: {
              appId,
              connectorType: 'slack',
              userIdOrTempId,
              metadata: userInfoJson,
              encryptedAccessToken: encryptToBase64(
                json.authed_user.access_token,
                process.env.ENCRYPTION_KEY!,
              ),
            },
            update: {
              metadata: jsonWithoutTokens.authed_user,
              encryptedAccessToken: encryptToBase64(
                json.authed_user.access_token,
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
            type: 'slack',
          },
        },
        data: {
          metadata: jsonWithoutTokens,
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
            key: 'SLACK_BOT_TOKEN',
          },
        },
        create: {
          appId,
          key: 'SLACK_BOT_TOKEN',
          encryptedValue,
        },
        update: {
          encryptedValue,
        },
      });

      return {
        appId,
        redirectTo,
        appConnectorUserAuth: appConnectorUserAuth || null,
      };
    },
  });
