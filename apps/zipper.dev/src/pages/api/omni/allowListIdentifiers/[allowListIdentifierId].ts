import { prisma } from '~/server/prisma';
import {
  successResponse,
  methodNotAllowed,
  createOmniApiHandler,
  simpleErrorResponse,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default createOmniApiHandler(async (req, res) => {
  const allowListIdentifierId = req.query.allowListIdentifierId as string;

  if (!allowListIdentifierId) {
    return simpleErrorResponse({
      res,
      status: Status.BAD_REQUEST,
      message: 'Missing allow list identifier id',
    });
  }

  switch (req.method) {
    // READ
    case Method.GET: {
      const allowListIdentifier = await prisma.allowListIdentifier.findFirst({
        where: { id: allowListIdentifierId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { allowListIdentifier },
        },
      });
    }

    // UPDATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      if (!req.body.allowList) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing allow list',
        });
      }

      const updatedAllowListIdentifier =
        await prisma.allowListIdentifier.update({
          where: { id: allowListIdentifierId },
          data: req.body.allowListIdentifier,
        });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            updated: true,
            allowListIdentifier: updatedAllowListIdentifier,
          },
        },
      });
    }

    // DELETE
    case Method.DELETE: {
      const deletedAllowListIdentifier =
        await prisma.allowListIdentifier.delete({
          where: { id: allowListIdentifierId },
        });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            deleted: true,
            allowListIdentifier: deletedAllowListIdentifier,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
