import { User } from '@prisma/client';
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { Session } from 'next-auth';
import {
  SessionOrganizationMembership,
  SessionUser,
} from '~/pages/api/auth/[...nextauth]';

const JWT_ACCESS_TOKEN_EXPIRY = '15m';
const JWT_REFRESH_TOKEN_EXPIRY = '7d';

export const generateAccessToken = (
  {
    userId,
    profile,
    orgMemberships,
    session,
  }: {
    userId: string;
    profile?: Pick<User, 'name' | 'email' | 'image' | 'slug'>;
    orgMemberships?: SessionOrganizationMembership[];
    session?: Session | null;
  },
  options?: { expiresIn?: string },
) => {
  const payload: Record<string, any> = {
    sub: userId,
  };

  if (profile) {
    payload.name = profile.name;
    payload.email = profile.email;
    payload.image = profile.image;
    payload.username = profile.slug;
  }

  if (session?.user) {
    payload.email = session.user.email!;
    payload.image = session.user.image || null;
    payload.name = session.user.name || null;
    payload.username = session.user.username!;
  }

  if (session?.organizationMemberships) {
    payload.organizations = session.organizationMemberships;
  }

  if (orgMemberships) {
    payload.organizations = orgMemberships;
  }

  return sign(payload, process.env.JWT_SIGNING_SECRET!, {
    expiresIn: options?.expiresIn || JWT_ACCESS_TOKEN_EXPIRY,
  });
};

export const generateRefreshToken = (userId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return sign({ sub: userId }, process.env.JWT_REFRESH_SIGNING_SECRET!, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRY,
  });
};

export const verifyAccessToken = (token: string) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return verify(token, process.env.JWT_SIGNING_SECRET!) as JwtPayload;
};

export default { generateAccessToken, generateRefreshToken };
