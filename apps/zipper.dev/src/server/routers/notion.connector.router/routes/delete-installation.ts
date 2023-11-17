import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { publicProcedure } from '~/server/root';
import { hasAppEditPermission } from '~/server/utils/authz.utils';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const NOTION = {
  DELETE_TOKEN_URL: 'https://api.notion.com/v1/integrations/tokens/revoke',
};

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

/**
 * It deletes previous installations, removing
 * storaged client_ids and token secrets from database
 */
const deleteInstallation = publicProcedure
  .input(
    z.object({
      appId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    await hasAppEditPermission({ ctx, appId: input.appId });

    /**
     * Reseting existing app-connector related
     * to the app_id in passed through the input
     */
    await prisma.appConnector.update({
      where: {
        appId_type: {
          appId: input.appId,
          type: 'notion',
        },
      },
      data: {
        metadata: Prisma.DbNull,
        clientId: null,
      },
    });

    const notion_token = await prisma.secret.findFirst({
      where: {
        appId: input.appId,
        key: { in: ['NOTION_BOT_TOKEN'] },
      },
    });

    /** revoking token access directly from notion api */
    await fetch(NOTION.DELETE_TOKEN_URL, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${notion_token}`,
      },
    });

    /** deleting existing secrets from database */
    await prisma.secret.deleteMany({
      where: {
        appId: input.appId,
        key: {
          in: ['NOTION_BOT_TOKEN', 'NOTION_CLIENT_SECRET'],
        },
      },
    });

    return true;
  });

export default deleteInstallation;
