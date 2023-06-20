import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { success, error } from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';

export default async function omniOrganizations(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    switch (req.method) {
      case Method.GET: {
        const organizations = await prisma.organization.findMany();
        return success(res)({
          ok: true,
          data: { organizations },
        });
      }
      case Method.PATCH:
      case Method.POST:
      case Method.PUT: {
        const body = req.body;
        console.log(body);
        const createdOrganizations = await prisma.organization.createMany();
        return success(res)({
          ok: true,
          data: {
            created: true,
            organizations: createdOrganizations,
          },
        });
      }
      default:
        return error(res)(
          {
            ok: false,
            errors: [
              {
                message: `Cannot use ${req.method}`,
                code: Status.METHOD_NOT_ALLOWED,
              },
            ],
          },
          { status: Status.METHOD_NOT_ALLOWED },
        );
    }
  } catch (e) {
    return error(res)({
      ok: false,
      errors: [
        {
          message: e?.toString?.() || JSON.stringify(e),
          code: Status.INTERNAL_SERVER_ERROR,
        },
      ],
    });
  }
}
