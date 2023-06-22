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
import { User } from '@prisma/client';

type UserToCreate = Partial<Omit<User, 'id'>> & { email: string };
type CreateUserRequest = {
  users: UserToCreate[];
  shouldCreateResourceOwnerSlug?: boolean;
};
type CreateUserAdapter = (
  data: UserToCreate,
  options?: { shouldCreateResourceOwnerSlug: boolean },
) => Promise<User>;

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    // CREATE
    case Method.PATCH:
    case Method.POST:
    case Method.PUT: {
      const errors: OmniApiError[] = [];

      const {
        users: usersToCreate,
        shouldCreateResourceOwnerSlug = false,
      }: CreateUserRequest = req.body;

      const noUsers = !Array.isArray(usersToCreate) || !usersToCreate.length;
      if (noUsers) {
        errors.push({ message: 'Missing or empty array of users' });
      }

      if (noUsers || usersToCreate.find((user) => !user.email)) {
        errors.push({ message: 'Each user must have an email' });
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

      const { createUser } = PrismaAdapter(prisma);

      const createdUsers = await Promise.all(
        usersToCreate.map((user) =>
          (createUser as CreateUserAdapter)(
            {
              ...user,
              emailVerified: user.emailVerified || null,
            },
            { shouldCreateResourceOwnerSlug },
          ),
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
