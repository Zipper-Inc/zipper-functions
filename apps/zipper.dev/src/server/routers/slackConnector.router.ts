/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
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
  __ZIPPER_TEMP_USER_ID,
} from '@zipper/utils';
import fetch from 'node-fetch';
import { AppConnectorUserAuth, Prisma } from '@prisma/client';
import { filterTokenFields } from '~/server/utils/json';
import { createTRPCRouter, publicProcedure } from '../root';
import { getSlackConfig } from '~/utils/connectors';

export const slackConnectorRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppReadPermission({ ctx, appId: input.appId });

      // get slack-connector file code
      const script = await prisma.script.findFirst({
        where: {
          id: input.appId,
          name: 'slack-connector',
        },
        select: {
          code: true,
          id: true,
        },
      });
      if (!script?.code) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No slack-connector script found',
        });
      }
      const slackConfig = getSlackConfig(script.code);

      const appConnectorFromDB = await prisma.appConnector.findFirst({
        where: {
          appId: input.appId,
          type: 'slack',
        },
        select: {
          events: true,
          type: true,
          isUserAuthRequired: true,
          metadata: true,
        },
      });

      return {
        ...slackConfig,
        ...appConnectorFromDB,
      };
    }),
  getAuthUrl: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        scopes: z.object({
          bot: z.array(z.string()),
          user: z.array(z.string()),
        }),
        postInstallationRedirect: z.string().optional(),
        redirectUri: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppReadPermission({ ctx, appId: input.appId });

      const { appId, scopes, postInstallationRedirect, redirectUri } = input;
      const state = encryptToHex(
        `${appId}::${postInstallationRedirect || ''}`,
        process.env.ENCRYPTION_KEY || '',
      );

      // TODO: until we move to slack-get-install-link applet, we need to grab the client id from the config code
      const connectorScript = await prisma.script.findFirst({
        where: {
          appId,
          name: 'slack-connector',
        },
        select: {
          code: true,
        },
      });

      if (!connectorScript?.code) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No slack-connector script found',
        });
      }

      const codeConfig = getSlackConfig(connectorScript.code);

      const clientId =
        codeConfig.clientId || process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!;

      const url = new URL('https://slack.com/oauth/v2/authorize');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('scope', scopes.bot.join(','));
      url.searchParams.set('user_scope', scopes.user.join(','));
      url.searchParams.set('state', state);
      if (redirectUri) {
        url.searchParams.set('redirect_uri', redirectUri);
      }

      return {
        url: url.toString(),
      };
    }),
  delete: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({ appId: input.appId, ctx });

      await prisma.appConnector.update({
        where: {
          appId_type: {
            appId: input.appId,
            type: 'slack',
          },
        },
        data: {
          metadata: Prisma.DbNull,
          clientId: null,
        },
      });

      await prisma.secret.deleteMany({
        where: {
          appId: input.appId,
          key: {
            in: ['SLACK_BOT_TOKEN', 'SLACK_USER_TOKEN', 'SLACK_CLIENT_SECRET'],
          },
        },
      });

      return true;
    }),
  deleteUserAuth: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userIdOrTempId =
        ctx.userId || (ctx.req?.cookies as any)[__ZIPPER_TEMP_USER_ID];

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
    }),
  exchangeCodeForToken: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

      const appInfo = await prisma.app.findFirst({
        where: {
          id: appId,
        },
        select: {
          slug: true,
        },
      });

      if (!appInfo) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'App not found',
        });
      }

      const clientSecretRecord = await prisma.secret.findFirst({
        where: {
          appId,
          key: 'SLACK_CLIENT_SECRET',
        },
      });

      let clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!;
      let clientSecret = process.env.SLACK_CLIENT_SECRET!;

      const slackConfig = await getSlackConfig(appInfo.slug);
      if (!slackConfig) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Something went wrong while trying to get the connector config',
        });
      }

      // const codeConfig = getSlackConfig(connectorScript.code);
      if (slackConfig.clientId && clientSecretRecord) {
        clientId = slackConfig.clientId;
        clientSecret = decryptFromBase64(
          clientSecretRecord.encryptedValue,
          process.env.ENCRYPTION_KEY,
        );
      }

      const res = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: input.code,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Something went wrong while exchanging the code for a token: ${json.error}`,
        });
      }

      const jsonWithoutTokens = filterTokenFields(json);

      let appConnectorUserAuth: AppConnectorUserAuth | undefined = undefined;

      const userIdOrTempId =
        userId ||
        ctx.userId ||
        (ctx.req?.cookies as any)[__ZIPPER_TEMP_USER_ID];
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

      if (json.access_token) {
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
      }

      if (json.authed_user.access_token) {
        const encryptedValue = encryptToBase64(
          json.authed_user.access_token,
          process.env.ENCRYPTION_KEY,
        );

        await prisma.secret.upsert({
          where: {
            appId_key: {
              appId: appId!,
              key: 'SLACK_USER_TOKEN',
            },
          },
          create: {
            appId,
            key: 'SLACK_USER_TOKEN',
            encryptedValue,
          },
          update: {
            encryptedValue,
          },
        });
      }

      return {
        appId,
        redirectTo,
        appConnectorUserAuth: appConnectorUserAuth || null,
      };
    }),
});
