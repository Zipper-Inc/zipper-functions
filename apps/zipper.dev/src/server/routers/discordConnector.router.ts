import { AppConnectorUserAuth, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
  decryptFromBase64,
  decryptFromHex,
  encryptToBase64,
  encryptToHex,
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

      const clientId = appConnector?.clientId || process.env.DISCORD_CLIENT_ID!;

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
          key: { in: ['DISCORD_BOT_TOKEN'] },
        },
      });

      await prisma.secret.deleteMany({
        where: {
          appId: input.appId,
          key: {
            in: ['DISOCRD_BOT_TOKEN', 'DISCORD_CLIENT_SECRET'],
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
          key: 'DISCORD_CLIENT_SECRET',
        },
      });

      let clientId = process.env.DISCORD_CLIENT_ID!;
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
          grant_type: 'authorization_code',
        }),
      });

      const accessJson = await res.json();

      if (!accessJson.access_token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Something went wrong while exchanging the code for a token: ${accessJson.error}`,
        });
      }

      const jsonWithoutTokens = filterTokenFields(accessJson);

      const appConnectorUserAuth: AppConnectorUserAuth | undefined = undefined;

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

      if (accessJson.access_token) {
        const encryptedValue = encryptToBase64(
          accessJson.access_token,
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

      return {
        appId,
        redirectTo,
        appConnectorUserAuth: appConnectorUserAuth || null,
      };
    }),
});
