import { prisma } from '~/server/prisma';
import {
  successResponse,
  methodNotAllowed,
  createOmniApiHandler,
  simpleErrorResponse,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default createOmniApiHandler(async (req, res) => {
  const appId = req.query.appId as string;
  const userId = req.query.userId as string;

  if (!appId) {
    return simpleErrorResponse({
      res,
      status: Status.BAD_REQUEST,
      message: 'Missing organization id',
    });
  }

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
      const appEditor = await prisma.appEditor.findFirst({
        where: { appId, userId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { appEditor },
        },
      });
    }

    // UPDATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      if (!req.body.appEditor) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing app editor object',
        });
      }

      const updatedEditor = await prisma.appEditor.update({
        where: { userId_appId: { userId, appId } },
        data: req.body.appEditor,
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            updated: true,
            appEditor: updatedEditor,
          },
        },
      });
    }

    // DELETE
    case Method.DELETE: {
      const appEditor = await prisma.appEditor.delete({
        where: { userId_appId: { userId, appId } },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            deleted: true,
            appEditor: appEditor,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
