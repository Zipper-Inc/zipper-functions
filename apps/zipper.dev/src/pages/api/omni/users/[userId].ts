import { prisma } from '~/server/prisma';
import {
  successResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
  simpleErrorResponse,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default createOmniApiHandler(async (req, res) => {
  const userId: string = req.query.userId as string;

  if (!userId) {
    return simpleErrorResponse({
      res,
      status: Status.BAD_REQUEST,
      message: 'Missing user id',
    });
  }

  switch (req.method) {
    // READ
    case Method.GET: {
      const user = await prisma.user.findFirst({
        where: { id: userId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { user },
        },
      });
    }

    // UPDATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      if (!req.body.user) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing user',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: req.body.user,
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            updated: true,
            user: updatedUser,
          },
        },
      });
    }

    // DELETE
    case Method.DELETE: {
      const deletedUser = await prisma.user.delete({
        where: { id: userId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            deleted: true,
            organization: deletedUser,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
