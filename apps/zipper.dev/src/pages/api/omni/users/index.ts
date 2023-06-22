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
import { ResourceOwnerSlug, User } from '@prisma/client';

type UserToCreate = Partial<Omit<User, 'id'>> & { email: string };
type CreateUsersRequest = {
  users: UserToCreate[];
  shouldCreateResourceOwnerSlug?: boolean;
};
type CreateUserAdapter = (
  data: UserToCreate,
  options?: { shouldCreateResourceOwnerSlug: boolean },
) => Promise<User>;

type CreateUsersData = {
  created: true;
  users: User[];
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
        users: usersToCreate,
        shouldCreateResourceOwnerSlug = true,
      }: CreateUsersRequest = req.body;

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

      const data: CreateUsersData = {
        created: true,
        users: createdUsers,
      };

      if (shouldCreateResourceOwnerSlug) {
        data.resourceOwnerSlugs = await prisma.resourceOwnerSlug.findMany({
          where: {
            OR: createdUsers.map((u) => ({ resourceOwnerId: u.id })),
          },
        });
      }

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
