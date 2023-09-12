import {
  createOmniApiHandler,
  successResponse,
  methodNotAllowed,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method } from '@zipper/types';
import { prisma } from '~/server/prisma';

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // READ
    case Method.GET: {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const applets = await prisma.app.findMany({
        select: {
          id: true,
          slug: true,
          _count: {
            select: {
              runs: {
                where: {
                  createdAt: {
                    gte: twentyFourHoursAgo,
                  },
                },
              },
            },
          },
          dailyRunLimit: true,
        },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            applets: applets.map((a) => ({
              id: a.id,
              slug: a.slug,
              dailyRunCount: a._count.runs,
              dailyRunLimit: a.dailyRunLimit,
            })),
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
