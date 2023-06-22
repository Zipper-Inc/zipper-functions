import { prisma } from '~/server/prisma';
import { PrismaAdapter } from '../../auth/[...nextauth]';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';
import { AllowListIdentifier } from '@prisma/client';

type AllowListIdentifierToCreate = Omit<AllowListIdentifier, 'id'>;
type CreateAllowListIdentifiersRequest = {
  allowListIdentifiers: AllowListIdentifierToCreate[];
};
type CreateAllowListIdentifierAdapter = (
  data: AllowListIdentifierToCreate,
) => Promise<AllowListIdentifier>;

type CreateAllowListIdentifiersData = {
  created: true;
  allowListIdentifiers: AllowListIdentifier[];
};

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const {
        allowListIdentifiers: allowListIdentifiersToCreate,
      }: CreateAllowListIdentifiersRequest = req.body;

      const noIdentifiers =
        !Array.isArray(allowListIdentifiersToCreate) ||
        !allowListIdentifiersToCreate.length;
      if (noIdentifiers) {
        errors.push({
          message: 'Missing or empty array of allow list identifiers',
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

      const data = await Promise.all(
        allowListIdentifiersToCreate.map((allowListIdentifier) =>
          prisma.allowListIdentifier.create({
            data: allowListIdentifier,
          }),
        ),
      );

      return successResponse({
        res,
        body: {
          ok: true,
          data,
        },
      });
    }

    // READ
    case Method.GET: {
      const allowListIdentifiers = await prisma.allowListIdentifier.findMany();
      return successResponse({
        res,
        body: {
          ok: true,
          data: { allowListIdentifiers },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
