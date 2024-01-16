import { prisma } from '~/server/prisma';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';
import {
  methodNotAllowed,
  ApiError,
  successResponse,
  createApiHandler,
  errorResponse,
} from '~/server/utils/api.utils';
import { Organization, ResourceOwnerSlug } from '@prisma/client';
import { organizationRouter } from '~/server/routers/organization.router';

type OrgToCreate = { name: string; slug?: string };

type CreateOrgsData = {
  created: true;
  organization: Organization;
  resourceOwnerSlug?: ResourceOwnerSlug;
};

export default createApiHandler(async (req, res, context) => {
  const errors: ApiError[] = [];
  if (!context.userId) errors.push({ message: 'Unauthorized' });

  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const org: OrgToCreate = req.body;

      if (!org.name) errors.push({ message: 'Organization must have a name' });

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

      const caller = organizationRouter.createCaller(context);
      const createdOrg = await caller.add({
        ...org,
        shouldCreateResourceOwnerSlug: true,
      });

      const data: CreateOrgsData = {
        created: true,
        organization: createdOrg,
      };

      data.resourceOwnerSlug = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId: createdOrg.id,
        },
      });

      return successResponse({
        res,
        body: { ok: true, data },
      });
    }

    case Method.GET: {
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

      const organizationsMemberships =
        await prisma.organizationMembership.findMany({
          where: { userId: context.userId },
          include: { organization: true },
        });

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            organizations: organizationsMemberships.map((m) => m.organization),
          },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
