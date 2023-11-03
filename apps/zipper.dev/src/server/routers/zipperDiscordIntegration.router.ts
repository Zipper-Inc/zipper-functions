/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import fetch from 'node-fetch';
import { prisma } from '../prisma';
import { encryptToBase64 } from '@zipper/utils';
import { getZipperDotDevUrlForServer } from '../utils/server-url.utils';
import { sendMessage } from '~/pages/api/slack/utils';
import { createTRPCRouter, publicProcedure } from '../root';

export const zipperDiscordIntegrationRouter = createTRPCRouter({
  exchangeCodeForToken: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET!;

      const res = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: input.code,
          redirect_uri:
            process.env.NODE_ENV === 'production'
              ? `${getZipperDotDevUrlForServer()}slack/auth`
              : `https://redirectmeto.com/${getZipperDotDevUrlForServer()}slack/auth`,
        }),
      });

      const accessJson = await res.json();

      if (!accessJson.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Something went wrong while exchanging the code for a token: ${accessJson.error}`,
        });
      }

      const encryptedBotToken = encryptToBase64(
        accessJson.access_token,
        process.env.ENCRYPTION_KEY!,
      );

      const installation = await prisma.discordZipperSlashCommandInstall.upsert(
        {
          where: {
            teamId_appId: {
              teamId: accessJson.team.id,
              appId: accessJson.app_id,
            },
          },
          create: {
            teamId: accessJson.team.id,
            appId: accessJson.app_id,
            botUserId: accessJson.bot_user_id,
            teamName: accessJson.team.name,
            installers: [accessJson.authed_user.id],
            encryptedBotToken,
          },
          update: {
            encryptedBotToken,
            teamName: accessJson.team.name,
            installers: {
              push: accessJson.authed_user.id,
            },
          },
        },
      );

      if (!installation) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      return {
        teamId: installation.teamId,
        appId: installation.appId,
        installerId: accessJson.authed_user.id,
      };
    }),
  sendWelcomeMessage: publicProcedure
    .input(
      z.object({
        teamId: z.string(),
        appId: z.string(),
        installerId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await sendMessage(input.appId, input.teamId, {
        channel: input.installerId,
        text: `:zap: You've installed the *Zipper* Slack app. You can now use \`zipper [app-slug]\` from any channel to run a public applet. `,
      });
    }),
});
