/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import {
  decryptFromBase64,
  decryptFromHex,
  encryptToBase64,
} from '@zipper/utils';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { publicProcedure } from '~/server/root';
import { filterTokenFields } from '~/server/utils/json';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const NOTION = {
  OAUTH_URL: 'https://api.notion.com/v1/oauth/token',
  CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET!,
  CLIENT_ID: process.env.NOTION_CLIENT_ID!,
  REDIRECT_URI:
    'https://redirectmeto.com/http://localhost:3000/connectors/notion/auth',
};

const ENCODED_NOTION_APP = Buffer.from(
  `${NOTION.CLIENT_ID}:${NOTION.CLIENT_SECRET}`,
).toString('base64');

/* -------------------------------------------- */
/* Models                                       */
/* -------------------------------------------- */

const AccessModel = z.object({
  access_token: z.string(),
  bot_id: z.string(),
  workspace_id: z.string(),
  workspace_name: z.string(),
});

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

const exchangeCodeForToken = publicProcedure
  .input(
    z.object({
      code: z.string(),
      state: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const app: Partial<
      Record<
        'id' | 'redirectTo' | 'userId' | 'clientSecret' | 'clientId',
        string | undefined
      >
    > = {};

    /**
     * ### Getting applet info from decrypted state
     * It gets the main information about the applet
     * based in the state search param comming from url
     * in the auth router handler
     * */
    try {
      const decryptedState = decryptFromHex(
        input.state,
        process.env.ENCRYPTION_KEY!,
      );

      const [id, redirectTo, userId]: string[] = decryptedState.split('::');

      app.id = id;
      app.redirectTo = redirectTo;
      app.userId = userId;
    } catch (error) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const [appConnector, clientSecretRecord] = await Promise.all([
      prisma.appConnector.findFirst({
        where: {
          appId: app.id,
          type: 'notion',
        },
      }),
      prisma.secret.findFirst({
        where: {
          appId: app.id,
          key: 'NOTION_CLIENT_SECRET',
        },
      }),
    ]);

    if (appConnector?.clientId && clientSecretRecord) {
      app.clientId = appConnector.clientId;

      app.clientSecret = decryptFromBase64(
        clientSecretRecord.encryptedValue,
        process.env.ENCRYPTION_KEY,
      );
    }

    /**
     * ### Handle auth token
     * it sends a POST request to notion API with
     * encode authorization string, is crucial to convert it
     * to base 64 before send
     */
    const response = await fetch(NOTION.OAUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ENCODED_NOTION_APP}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: input.code,
        redirect_uri:
          process.env.NODE_ENV === 'development'
            ? `https://redirectmeto.com/http://localhost:3000/connectors/notion/auth`
            : 'https://zipper.dev/connectors/notion/auth',
      }),
    }).then((res) => res.json());

    if (!response.access_token) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Something went wrong while exchanging the code for a token: ${JSON.stringify(
          response,
          null,
          2,
        )}`,
      });
    }

    const access = AccessModel.parse(response);
    const jsonWithoutTokens = filterTokenFields(access);

    /** updating app-connector metadata */
    await prisma.appConnector.update({
      where: {
        appId_type: {
          appId: app.id!,
          type: 'notion',
        },
      },
      data: {
        metadata: jsonWithoutTokens,
      },
    });

    if (access.access_token) {
      const encryptedValue = encryptToBase64(
        access.access_token,
        process.env.ENCRYPTION_KEY,
      );

      /** encrypting and storing the access_token */
      await prisma.secret.upsert({
        where: {
          appId_key: {
            appId: app.id!,
            key: 'NOTION_BOT_TOKEN',
          },
        },
        create: {
          appId: app.id!,
          key: 'NOTION_BOT_TOKEN',
          encryptedValue,
        },
        update: {
          encryptedValue,
        },
      });
    }

    return {
      appId: app.id,
      redirectTo: app.redirectTo,
    };
  });

export default exchangeCodeForToken;
