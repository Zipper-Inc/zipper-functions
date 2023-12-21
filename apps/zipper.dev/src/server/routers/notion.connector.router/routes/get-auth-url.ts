/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { encryptToHex } from '@zipper/utils';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { publicProcedure } from '~/server/root';
import { hasAppReadPermission } from '~/server/utils/authz.utils';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const NOTION = {
  AUTH_URL: 'https://api.notion.com/v1/oauth/authorize',
  CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET!,
  CLIENT_ID: process.env.NOTION_CLIENT_ID!,
  REDIRECT_URI:
    process.env.NODE_ENV === 'development'
      ? 'https://redirectmeto.com/http://localhost:3000/connectors/notion/auth'
      : 'https://zipper.dev/connectors/notion/auth',
};

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

/**
 * It returns a pre-mounted url with encrypted state
 * and allready pre-setted client_id if existing
 */
export const getAuthUrl = publicProcedure
  .input(
    z.object({
      appId: z.string(),
      redirectUri: z.string().optional(),
      postInstallationRedirect: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    await hasAppReadPermission({ ctx, appId: input.appId });

    /** checking if a client for this app already exists */
    const appConnector = await prisma.appConnector.findFirst({
      where: {
        appId: input.appId,
        type: 'notion',
      },
    });

    const STATE = encryptToHex(
      `${input.appId}::${input.postInstallationRedirect || ''}`,
      process.env.ENCRYPTION_KEY || '',
    );

    const CLIENT_ID = appConnector?.clientId || NOTION.CLIENT_ID;
    const REDIRECT_URI = input.redirectUri || NOTION.REDIRECT_URI;

    const url = new URL(NOTION.AUTH_URL);

    url.searchParams.set('owner', 'user');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', REDIRECT_URI);
    url.searchParams.set('state', STATE);

    return { href: url.toString() };
  });

export default getAuthUrl;
