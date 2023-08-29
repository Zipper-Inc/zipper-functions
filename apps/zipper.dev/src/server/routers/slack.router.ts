/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '../createRouter';
import fetch from 'node-fetch';

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

    const json = await res.json();

    console.log('FROM SLACK: ', json);

    if (!json.ok) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Something went wrong while exchanging the code for a token: ${json.error}`,
      });
    }

    return {};
  },
});
