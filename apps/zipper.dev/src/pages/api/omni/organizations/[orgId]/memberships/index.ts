import { prisma } from '~/server/prisma';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
  simpleErrorResponse,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

const DEFAULT_ROLE = 'member';

export default createOmniApiHandler(async (req, res) => {
  const organizationId = req.query.orgId as string;
  if (!organizationId) {
    return simpleErrorResponse({
      res,
      message: 'Missing org id',
      status: Status.BAD_REQUEST,
    });
  }

  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const membershipsToCreate: {
        userId: string;
        role: string;
      }[] = req.body.memberships;

      const noMemberships =
        !Array.isArray(membershipsToCreate) || !membershipsToCreate.length;
      if (noMemberships) {
        errors.push({ message: 'Missing or empty array of memberships' });
      }

      if (
        noMemberships ||
        membershipsToCreate.find((membership) => !membership.userId)
      ) {
        errors.push({ message: 'Each membership must have a userId' });
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

      const createdMemberships = await Promise.all(
        membershipsToCreate.map(({ userId, role }) =>
          prisma.organizationMembership.create({
            data: {
              userId,
              organizationId,
              role: role || DEFAULT_ROLE,
            },
          }),
        ),
      );

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            created: true,
            memberships: createdMemberships,
          },
        },
      });
    }

    // READ
    case Method.GET: {
      const organization = await prisma.organization.findFirst({
        where: { id: organizationId },
      });
      const memberships = await prisma.organizationMembership.findMany({
        where: { organizationId },
        include: { user: true },
      });

      return successResponse({
        res,
        body: {
          ok: true,
          data: { organization, memberships },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
