import { prisma } from '~/server/prisma';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';
import {
  createApiHandler,
  methodNotAllowed,
  simpleErrorResponse,
  successResponse,
} from '~/server/utils/api.utils';
import {
  hasOrgAdminPermission,
  hasOrgMemberPermission,
} from '~/server/utils/authz.utils';
import { organizationRouter } from '~/server/routers/organization.router';

export default createApiHandler(async (req, res, context) => {
  const orgId = req.query.orgId as string;

  const contextWithOrgId = { ...context, orgId };

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
      const isMember = await hasOrgMemberPermission(contextWithOrgId);
      console.log(isMember);
      if (!isMember)
        return simpleErrorResponse({
          res,
          status: Status.UNAUTHORIZED,
          message: 'Unauthorized',
        });

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
      const isAdmin = await hasOrgAdminPermission(contextWithOrgId);
      if (!isAdmin)
        return simpleErrorResponse({
          res,
          status: Status.UNAUTHORIZED,
          message: 'Unauthorized',
        });

      const caller = organizationRouter.createCaller(contextWithOrgId);
      const updatedOrg = await caller.update({
        name: req.body.name,
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

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
