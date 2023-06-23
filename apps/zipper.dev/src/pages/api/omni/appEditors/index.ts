import { prisma } from '~/server/prisma';
import { organizationRouter } from '~/server/routers/organization.router';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';
import { error } from 'console';

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const appEditorsToCreate: {
        appId: string;
        userId: string;
        isOwner: boolean;
      }[] = req.body.appEditors;

      const noEditors =
        !Array.isArray(appEditorsToCreate) || !appEditorsToCreate.length;
      if (noEditors) {
        errors.push({ message: 'Missing or empty array of app editors' });
      }

      let appIds = appEditorsToCreate.map((appEditor) => appEditor.appId);
      appIds = appIds.filter(
        (value, index, array) => array.indexOf(value) === index,
      );

      await Promise.all(
        appIds.map(async (appId) => {
          const app = prisma.app.findUnique({ where: { id: appId } });
          if (!app) {
            errors.push({ message: `Invalid app id: ${appId}` });
          }
        }),
      );

      let userIds = appEditorsToCreate.map((appEditor) => appEditor.userId);
      userIds = userIds.filter(
        (value, index, array) => array.indexOf(value) === index,
      );

      await Promise.all(
        userIds.map(async (userId) => {
          const user = prisma.user.findUnique({ where: { id: userId } });
          if (!user) {
            errors.push({ message: `Invalid user id: ${userId}` });
          }
        }),
      );

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

      const createdEditors = await Promise.all(
        appEditorsToCreate.map((appEditor) =>
          prisma.appEditor.create({
            data: appEditor,
          }),
        ),
      );

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            created: true,
            appEditors: createdEditors,
          },
        },
      });
    }

    // READ
    case Method.GET: {
      const editors = await prisma.appEditor.findMany();

      return successResponse({
        res,
        body: {
          ok: true,
          data: { editors },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
