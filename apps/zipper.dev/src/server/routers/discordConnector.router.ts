import { AppConnectorUserAuth, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
  decryptFromBase64,
  decryptFromHex,
  encryptToBase64,
  encryptToHex,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
} from '@zipper/utils';
import { z } from 'zod';
import { prisma } from '../prisma';
import { createTRPCRouter, publicProcedure } from '../root';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import { filterTokenFields } from '../utils/json';

export const discordConnectorRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppReadPermission({ ctx, appId: input.appId });

      return prisma.appConnector.findFirst({
        where: {
          appId: input.appId,
          type: 'discord',
        },
      });
    }),

  getAuthUrl: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        scopes: z.object({
          bot: z.array(z.string()),
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

      // check if we have a client id for this app in the appConnector table
      const appConnector = await prisma.appConnector.findFirst({
        where: {
          appId,
          type: 'discord',
        },
      });

      const clientId =
        appConnector?.clientId || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;

      const url = new URL('https://discord.com/api/oauth2/authorize');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('permissions', '8');
      url.searchParams.set('scope', scopes.bot.join(' '));
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
            type: 'discord',
          },
        },
        data: {
          metadata: Prisma.DbNull,
          clientId: null,
        },
      });

      const tokens = await prisma.secret.findMany({
        where: {
          appId: input.appId,
          key: { in: ['SLACK_DISCORD_TOKEN'] },
        },
      });

      await prisma.secret.deleteMany({
        where: {
          appId: input.appId,
          key: {
            in: ['SLACK_BOT_TOKEN', 'SLACK_CLIENT_SECRET'],
          },
        },
      });

      tokens.forEach((secret) => {
        const body = new URLSearchParams();

        body.append(
          'token',
          decryptFromBase64(secret.encryptedValue, process.env.ENCRYPTION_KEY!),
        );
        body.append('client_id', secret.appId);
        body.append('client_secret', secret.id);

        fetch('https://discord.com/api/oauth2/token/revoke', {
          method: 'POST',
          body,
        });
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

      const appConnector = await prisma.appConnector.findFirst({
        where: {
          appId,
          type: 'discord',
        },
      });

      const clientSecretRecord = await prisma.secret.findFirst({
        where: {
          appId,
          key: 'SLACK_CLIENT_SECRET',
        },
      });

      let clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
      let clientSecret = process.env.DISCORD_CLIENT_SECRET!;

      if (appConnector?.clientId && clientSecretRecord) {
        clientId = appConnector?.clientId;
        clientSecret = decryptFromBase64(
          clientSecretRecord.encryptedValue,
          process.env.ENCRYPTION_KEY,
        );
      }

      const res = await fetch('https://discord.com/api/oauth2/token', {
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
        (ctx.req?.cookies as any)[ZIPPER_TEMP_USER_ID_COOKIE_NAME];

      if (appId && json.authed_user.scope && userIdOrTempId) {
        // Perform a POST request to Discord's user information endpoint

        try {
          const response = await fetch(
            'https://discord.com/api/v10/users/@me',
            {
              method: 'GET', // Use GET for user information
              headers: {
                Authorization: `Bearer ${json.authed_user.access_token}`, // Set the access token in the Authorization header
              },
            },
          );

          if (response.ok) {
            const userInfoJson = await response.json();

            appConnectorUserAuth = await prisma.appConnectorUserAuth.upsert({
              where: {
                appId_connectorType_userIdOrTempId: {
                  appId,
                  connectorType: 'discord',
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
            // You can use userInfo as needed
          } else {
            console.error(
              'Failed to fetch user information from Discord:',
              response.status,
              response.statusText,
            );
          }
        } catch (error) {
          console.error('Error fetching user information from Discord:', error);
        }
      }

      await prisma.appConnector.update({
        where: {
          appId_type: {
            appId: appId!,
            type: 'discord',
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
              key: 'DISCORD_BOT_TOKEN',
            },
          },
          create: {
            appId,
            key: 'DISCORD_BOT_TOKEN',
            encryptedValue,
          },
          update: {
            encryptedValue,
          },
        });
      }

      // if (json.authed_user.access_token) {
      //   const encryptedValue = encryptToBase64(
      //     json.authed_user.access_token,
      //     process.env.ENCRYPTION_KEY,
      //   );

      //   await prisma.secret.upsert({
      //     where: {
      //       appId_key: {
      //         appId: appId!,
      //         key: 'DISCORD_USER_TOKEN',
      //       },
      //     },
      //     create: {
      //       appId,
      //       key: 'DISCORD_USER_TOKEN',
      //       encryptedValue,
      //     },
      //     update: {
      //       encryptedValue,
      //     },
      //   });
      // }

      return {
        appId,
        redirectTo,
        appConnectorUserAuth: appConnectorUserAuth || null,
      };
    }),
});
