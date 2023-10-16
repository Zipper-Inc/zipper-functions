import * as Sentry from '@sentry/nextjs';
import { compare } from 'bcryptjs';
import { prisma } from '~/server/prisma';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { SessionOrganizationMembership } from '../pages/api/auth/[...nextauth]';

export type UserInfoReturnType = {
  email?: string;
  userId?: string;
  organizations?: SessionOrganizationMembership[];
};

export async function getUserInfo(
  token: string,
  appSlug: string,
): Promise<UserInfoReturnType> {
  try {
    //if there's no token, there's no authed user
    if (!token) throw new Error('No token');

    const tokenType = token?.startsWith('zaat')
      ? 'app_access_token'
      : 'user_access_token';

    if (tokenType === 'user_access_token') {
      const auth = verifyAccessToken(token);

      // if there's an auth object, but no user, then there's no authed user
      if (!auth || !auth.sub) {
        throw new Error('No Zipper user');
      }

      return {
        email: auth.email,
        userId: auth.sub,
        organizations: auth.organizations,
      };
    } else {
      // Validate the Zipper access token
      // The token should be in the format: zaat.{identifier}.{secret}
      const [, identifier, secret] = token.split('.');
      if (!identifier || !secret) throw new Error('Invalid Zipper token');

      const appAccessToken = await prisma.appAccessToken.findFirstOrThrow({
        where: {
          identifier,
          app: {
            slug: appSlug,
          },
          deletedAt: null,
        },
      });

      // compare the hashed secret with a hash of the secret portion of the token
      const validSecret = await compare(secret, appAccessToken.hashedSecret);

      if (!validSecret) throw new Error();

      const user = await prisma.user.findUnique({
        where: {
          id: appAccessToken.userId,
        },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) throw new Error('No user');

      return {
        email: user.email,
        userId: user.id,
        organizations: user.organizationMemberships.map((mem) => {
          return {
            organization: {
              id: mem.organization.id,
              name: mem.organization.name,
              slug: mem.organization.slug,
            },
            role: mem.role,
            pending: false,
          };
        }),
      };
    }
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    return { email: undefined, organizations: [] };
  }
}
