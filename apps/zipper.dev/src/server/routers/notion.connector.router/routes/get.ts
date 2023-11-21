import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { publicProcedure } from '~/server/root';
import { hasAppReadPermission } from '~/server/utils/authz.utils';

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

const getConnector = publicProcedure
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
        type: 'notion',
      },
    });
  });

export default getConnector;
