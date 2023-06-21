import { prisma } from '~/server/prisma';
import { organizationRouter } from '~/server/routers/organization.router';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
  getOmniContext,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const orgsToCreate: { name: string }[] = req.body.organizations;

      const noOrgs = !Array.isArray(orgsToCreate) || !orgsToCreate.length;
      if (noOrgs) {
        errors.push({ message: 'Missing or empty array of organizations' });
      }

      if (noOrgs || orgsToCreate.find((org) => !org.name)) {
        errors.push({ message: 'Each organization must have a name' });
      }

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

      const caller = organizationRouter.createCaller(getOmniContext(req));
      const createdOrgs = await Promise.all(
        orgsToCreate.map((org) => caller.mutation('add', org)),
      );

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            created: true,
            organizations: createdOrgs,
          },
        },
      });
    }

    // READ
    case Method.GET: {
      const organizations = await prisma.organization.findMany();
      return successResponse({
        res,
        body: {
          ok: true,
          data: { organizations },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
