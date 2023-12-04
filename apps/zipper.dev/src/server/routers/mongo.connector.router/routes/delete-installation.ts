import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { publicProcedure } from '~/server/root';
import { hasAppEditPermission } from '~/server/utils/authz.utils';

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
          type: 'postgres',
        },
      },
      data: {
        metadata: Prisma.DbNull,
        clientId: null,
      },
    });

    /** deleting existing secrets from database */
    await prisma.secret.deleteMany({
      where: {
        appId: input.appId,
        key: {
          in: ['MONGO_CONNECTION_STRING'],
        },
      },
    });

    return true;
  });

export default deleteInstallation;
