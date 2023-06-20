import { prisma } from '~/server/prisma';
import { PrismaAdapter } from '../auth/[...nextauth]';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  createOmniApiHandler,
  OmniApiError,
} from '~/server/utils/omni.utils';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';
import { User } from '@prisma/client';

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const usersToCreate: { email: string; emailVerified?: Date | null }[] =
        req.body.users;

      // Make sure there are orgs
      const noUsers = !Array.isArray(usersToCreate) || !usersToCreate.length;
      if (noUsers) {
        errors.push({ message: 'Missing or empty array of users' });
      }

      // Make sure each org has at least a name
      if (noUsers || usersToCreate.find((user) => !user.email)) {
        errors.push({ message: 'Each user must have an email' });
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

      const { createUser } = PrismaAdapter(prisma);

      const createdUsers = await Promise.all(
        usersToCreate.map(
          (user) =>
            createUser({
              ...user,
              emailVerified: user.emailVerified || null,
            }) as User,
        ),
      );

      return successResponse({
        res,
        body: {
          ok: true,
          data: {
            created: true,
            users: createdUsers,
          },
        },
      });
    }

    // READ
    case Method.GET: {
      const users = await prisma.user.findMany();
      return successResponse({
        res,
        body: {
          ok: true,
          data: { users },
        },
      });
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
