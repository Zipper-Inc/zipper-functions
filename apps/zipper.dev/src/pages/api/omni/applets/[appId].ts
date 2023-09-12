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

  if (!appId) {
    return simpleErrorResponse({
      res,
      status: Status.BAD_REQUEST,
      message: 'Missing user id',
    });
  }

  switch (req.method) {
    // READ
    case Method.GET: {
      const applet = await prisma.app.findFirst({
        where: { id: appId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { applet },
        },
      });
    }

    // UPDATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      if (!req.body.applet) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing applet',
        });
      }

      const updatedApplet = await prisma.app.update({
        where: { id: appId },
        data: req.body.applet,
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            updated: true,
            applet: updatedApplet,
          },
        },
      });
    }

    // DELETE
    case Method.DELETE: {
      const deletedApplet = await prisma.app.delete({
        where: { id: appId },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            deleted: true,
            applet: deletedApplet,
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
