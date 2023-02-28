/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '../createRouter';
import { prisma } from '../prisma';
import { hasAppEditPermission } from '../utils/authz.utils';
import {
  decryptFromHex,
  encryptToBase64,
  encryptToHex,
} from '../utils/crypto.utils';
import fetch from 'node-fetch';

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
      userId: z.string().optional(),
      scopes: z.array(z.string()),
      redirectTo: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      if (!hasAppEditPermission({ ctx, appId: input.appId })) {
        new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const { appId, userId, scopes, redirectTo } = input;
      const state = encryptToHex(
        `${appId}::${userId || ''}::${redirectTo || ''}`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://slack.com/oauth/v2/authorize');
      url.searchParams.set(
        'client_id',
        process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
      );
      url.searchParams.set('scope', scopes.join(','));
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

      await prisma.secret.deleteMany({
        where: {
          appId: input.appId,
          key: 'SLACK_BOT_TOKEN',
        },
      });

      return true;
    },
  })
  .mutation('slack.exchangeCodeForToken', {
    input: z.object({
      code: z.string(),
      state: z.string(),
    }),
    async resolve({ input }) {
      let appId: string | undefined;
      let userId: string | undefined;
      let redirectTo: string | undefined;
      try {
        const decryptedState = decryptFromHex(
          input.state,
          process.env.ENCRYPTION_KEY!,
        );
        [appId, userId, redirectTo] = decryptedState.split('::');
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

      await prisma.secret.create({
        data: {
          appId,
          key: 'SLACK_BOT_TOKEN',
          encryptedValue,
        },
      });

      return { appId, redirectTo };
    },
  });
