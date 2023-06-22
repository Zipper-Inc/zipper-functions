import { prisma } from '~/server/prisma';
import { PrismaAdapter } from '../../auth/[...nextauth]';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
  getOmniContext,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';
import { ResourceOwnerSlug } from '@prisma/client';
import { ResourceOwnerType } from '@zipper/types';
import { resourceOwnerSlugRouter } from '~/server/routers/resourceOwnerSlug.router';

type ResourceOwnerSlugToCreate = {
  slug: string;
  resourceOwnerId: string;
  resourceOwnerType: ResourceOwnerType;
};

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const {
        resourceOwnerSlugs: ownersToCreate,
      }: { resourceOwnerSlugs: ResourceOwnerSlugToCreate[] } = req.body;

      const noUsers = !Array.isArray(ownersToCreate) || !ownersToCreate.length;
      if (noUsers) {
        errors.push({
          message: 'Missing or empty array of resource owner slugs',
        });
      }

      if (
        noUsers ||
        ownersToCreate.find(
          (owner) =>
            !owner.slug ||
            !owner.resourceOwnerId ||
            !Number.isInteger(owner.resourceOwnerType),
        )
      ) {
        errors.push({
          message:
            'Each resource owner slug must have a slug, resourceOwnerId, and resourceOwnerType',
        });
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
      const caller = resourceOwnerSlugRouter.createCaller(getOmniContext(req));
      const createdResourceOwnerSlugs = (await Promise.all(
        ownersToCreate.map((owner) => caller.mutation('add', owner)),
      )) as ResourceOwnerSlug[];

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            created: true,
            resourceOwnerSlugs: createdResourceOwnerSlugs,
          },
        },
      });
    }

    // READ
    case Method.GET: {
      const resourceOwnerSlugs = await prisma.resourceOwnerSlug.findMany();
      return successResponse({
        res,
        body: {
          ok: true,
          data: { resourceOwnerSlugs },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
