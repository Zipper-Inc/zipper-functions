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
import slugify from '~/utils/slugify';

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      if (!req.body) {
        errors.push({ message: 'Missing body' });
      }

      const orgsToCreate: { name: string }[] = req.body?.organizations;

      // Make sure there are orgs
      if (!Array.isArray(orgsToCreate) || !orgsToCreate.length) {
        errors.push({ message: 'Missing organizations' });
      }

      // Make sure each org has at least a name
      if (orgsToCreate.find((org) => !org.name)) {
        errors.push({ message: 'Each organization must have a name' });
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

      const caller = organizationRouter.createCaller(getOmniContext(req));
      const createdOrgs = await Promise.all(
        orgsToCreate.map((org) => caller.mutation('add', org)),
      );

      successResponse({
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
