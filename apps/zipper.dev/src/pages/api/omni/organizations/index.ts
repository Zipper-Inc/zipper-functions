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
import { Organization, ResourceOwnerSlug } from '@prisma/client';

type OrgToCreate = { name: string; slug?: string };
type CreateOrgsRequest = {
  organizations: OrgToCreate[];
  shouldCreateResourceOwnerSlug?: boolean;
};
type CreateOrgsData = {
  created: true;
  organizations: Organization[];
  resourceOwnerSlugs?: ResourceOwnerSlug[];
};

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const {
        organizations: orgsToCreate,
        shouldCreateResourceOwnerSlug = true,
      }: CreateOrgsRequest = req.body;

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
      const createdOrgs = (await Promise.all(
        orgsToCreate.map((org) =>
          caller.add({
            ...org,
            shouldCreateResourceOwnerSlug,
            // The API should never assign itself as an admin
            shouldAssignAdmin: false,
          }),
        ),
      )) as Organization[];

      const data: CreateOrgsData = {
        created: true,
        organizations: createdOrgs,
      };

      if (shouldCreateResourceOwnerSlug) {
        data.resourceOwnerSlugs = await prisma.resourceOwnerSlug.findMany({
          where: {
            OR: createdOrgs.map((org) => ({ resourceOwnerId: org.id })),
          },
        });
      }

      return successResponse({
        res,
        body: { ok: true, data },
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
