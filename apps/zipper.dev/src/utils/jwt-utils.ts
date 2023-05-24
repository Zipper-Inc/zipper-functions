import { OrganizationMembership, User } from '@clerk/clerk-sdk-node';
import { JwtPayload, sign, verify } from 'jsonwebtoken';

const JWT_ACCESS_TOKEN_EXPIRY = '15m';
const JWT_REFRESH_TOKEN_EXPIRY = '7d';

export const generateAccessToken = (
  {
    userId,
    profile,
    orgMemberships,
  }: {
    userId: string;
    profile?: Pick<
      User,
      'firstName' | 'lastName' | 'emailAddresses' | 'primaryEmailAddressId'
    >;
    orgMemberships?: OrganizationMembership[];
  },
  options?: { expiresIn?: string },
) => {
  const payload: Record<string, any> = {
    sub: userId,
  };

  if (profile) {
    payload.firstName = profile.firstName;
    payload.lastName = profile.lastName;
    payload.primaryEmail = profile.emailAddresses.find((e) => {
      e.id === profile.primaryEmailAddressId;
    })?.emailAddress;
  }

  if (orgMemberships) {
    payload.organizations = orgMemberships.map((om) => {
      return { [om.organization.id]: om.role };
    });
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
