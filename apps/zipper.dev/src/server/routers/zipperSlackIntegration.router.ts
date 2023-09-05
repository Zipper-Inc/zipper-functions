/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '../createRouter';
import fetch from 'node-fetch';
import { prisma } from '../prisma';
import { encryptToBase64 } from '@zipper/utils';
import { getZipperDotDevUrlForServer } from '../utils/server-url.utils';
import { sendMessage } from '~/pages/api/slack/utils';

export const zipperSlackIntegrationRouter = createRouter()
  .mutation('exchangeCodeForToken', {
    input: z.object({
      code: z.string(),
      state: z.string(),
    }),
    async resolve({ ctx, input }) {
      const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!;
      const clientSecret = process.env.SLACK_CLIENT_SECRET!;

      const res = await fetch('https://slack.com/api/oauth.v2.access', {
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

      const installation = await prisma.slackZipperSlashCommandInstall.upsert({
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
          installers: [accessJson.user_id.id],
          encryptedBotToken,
        },
        update: {
          encryptedBotToken,
          teamName: accessJson.team.name,
          installers: {
            push: accessJson.user_id.id,
          },
        },
      });

      if (!installation) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      return {
        teamId: installation.teamId,
        appId: installation.appId,
        installerId: accessJson.authed_user.id,
      };
    },
  })
  .mutation('sendWelcomeMessage', {
    input: z.object({
      teamId: z.string(),
      appId: z.string(),
      installerId: z.string(),
    }),
    async resolve({ input }) {
      await sendMessage(input.appId, input.teamId, {
        channel: input.installerId,
        text: `:zap: You've installed the *Zipper* Slack app. You can now use \`zipper [app-slug]\` from any channel to run a public applet. `,
      });
    },
  });
