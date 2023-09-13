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
      const applets = await prisma.app.findMany();

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            applets,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
