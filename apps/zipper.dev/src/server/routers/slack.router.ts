/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '../createRouter';
import fetch from 'node-fetch';
import { prisma } from '../prisma';
import { encryptToBase64 } from '@zipper/utils';
import { Prisma } from '@prisma/client';

export const slackRouter = createRouter().mutation('exchangeCodeForToken', {
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
          'https://redirectmeto.com/http://localhost:3000/slack/auth',
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

    const defaultSelect =
      Prisma.validator<Prisma.SlackZipperSlashCommandInstallSelect>()({
        teamId: true,
        appId: true,
        encryptedBotToken: true,
        createdAt: true,
      });

    const installation = await prisma.slackZipperSlashCommandInstall.create({
      data: {
        teamId: accessJson.team.id,
        appId: accessJson.app_id,
        encryptedBotToken,
      },
      select: defaultSelect,
    });

    if (!installation) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

    return {};
  },
});
