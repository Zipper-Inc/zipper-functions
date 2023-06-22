import { prisma } from '~/server/prisma';
import {
  successResponse,
  methodNotAllowed,
  createOmniApiHandler,
  simpleErrorResponse,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default createOmniApiHandler(async (req, res) => {
  const slug = req.query.slug as string;

  if (!slug) {
    return simpleErrorResponse({
      res,
      status: Status.BAD_REQUEST,
      message: 'Missing slug',
    });
  }

  switch (req.method) {
    // READ
    case Method.GET: {
      const resourceOwnerSlug = await prisma.resourceOwnerSlug.findFirst({
        where: { slug },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { resourceOwnerSlug },
        },
      });
    }

    // UPDATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      if (!req.body.resourceOwnerSlug) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing resource owner slug',
        });
      }

      const updatedOwner = await prisma.resourceOwnerSlug.update({
        where: { slug },
        data: req.body.resourceOwnerSlug,
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            updated: true,
            resourceOwnerSlug: updatedOwner,
          },
        },
      });
    }

    // DELETE
    case Method.DELETE: {
      const deletedOwner = await prisma.resourceOwnerSlug.delete({
        where: { slug },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            deleted: true,
            organization: deletedOwner,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
