import { prisma } from '~/server/prisma';
import {
  successResponse,
  methodNotAllowed,
  createOmniApiHandler,
  simpleErrorResponse,
  OmniApiError,
  errorResponse,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default createOmniApiHandler(async (req, res) => {
  const organizationId = req.query.orgId as string;
  const userId = req.query.userId as string;

  const errors: OmniApiError[] = [];

  if (!organizationId) {
    errors.push({ message: 'Missing org id' });
  }

  if (!userId) {
    errors.push({ message: 'Missing user id' });
  }

  if (errors.length) {
    return errorResponse({
      res,
      status: Status.BAD_REQUEST,
      body: { ok: false, errors },
    });
  }

  switch (req.method) {
    // READ
    case Method.GET: {
      const membership = await prisma.organizationMembership.findFirst({
        where: { organizationId, userId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { membership },
        },
      });
    }

    // UPDATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      if (!req.body.membership) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing membership',
        });
      }

      const updatedMembership = await prisma.organizationMembership.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        data: req.body.membership,
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            updated: true,
            membership: updatedMembership,
          },
        },
      });
    }

    // DELETE
    case Method.DELETE: {
      const deletedMembership = await prisma.organizationMembership.delete({
        where: { organizationId_userId: { organizationId, userId } },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            deleted: true,
            organization: deletedMembership,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
