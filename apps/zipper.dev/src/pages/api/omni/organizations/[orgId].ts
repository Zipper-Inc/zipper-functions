import { prisma } from '~/server/prisma';

import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
  simpleErrorResponse,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default createOmniApiHandler(async (req, res) => {
  const orgId: string = req.query.orgId as string;
  if (!orgId) {
    return simpleErrorResponse({
      res,
      status: Status.BAD_REQUEST,
      message: 'Missing organization id',
    });
  }

  switch (req.method) {
    // READ
    case Method.GET: {
      const organization = await prisma.organization.findFirst({
        where: { id: orgId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { organization },
        },
      });
    }

    // UPDATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      if (!req.body.organization) {
        errors.push({ message: 'Missing organization' });
      }

      // Return if there are any errors
      if (errors.length) {
        return errorResponse({
          res,
          body: {
            ok: false,
            errors,
          },
          status: Status.BAD_REQUEST,
        });
      }

      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: req.body.organization,
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            updated: true,
            organization: updatedOrg,
          },
        },
      });
    }

    // DELETE
    case Method.DELETE: {
      const deletedOrg = await prisma.organization.delete({
        where: { id: orgId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            deleted: true,
            organization: deletedOrg,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
