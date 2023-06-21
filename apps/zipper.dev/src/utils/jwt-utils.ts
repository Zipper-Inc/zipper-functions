import { OrganizationMembership, User } from '@prisma/client';
import { Jwt, JwtPayload, sign, verify } from 'jsonwebtoken';
import { JWT } from 'next-auth/jwt';
import { SessionOrganizationMembership } from '~/pages/api/auth/[...nextauth]';

const JWT_ACCESS_TOKEN_EXPIRY = '15m';
const JWT_REFRESH_TOKEN_EXPIRY = '7d';

export const generateAccessToken = (
  {
    userId,
    profile,
    orgMemberships,
    authToken,
  }: {
    userId: string;
    profile?: Pick<User, 'name' | 'email' | 'image' | 'slug'>;
    orgMemberships?: SessionOrganizationMembership[];
    authToken?: JWT | null;
  },
  options?: { expiresIn?: string },
) => {
  const payload: Record<string, any> = {
    sub: userId,
  };

  if (profile) {
    console.log('profile', profile);
    payload.name = profile.name;
    payload.email = profile.email;
    payload.image = profile.image;
    payload.username = profile.slug;
  }

  if (authToken) {
    payload.email = authToken.email!;
    payload.image = authToken.picture || null;
    payload.name = authToken.name || null;
    payload.username = authToken.slug!;
    payload.organizations = authToken.organizationMemberhips;
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
