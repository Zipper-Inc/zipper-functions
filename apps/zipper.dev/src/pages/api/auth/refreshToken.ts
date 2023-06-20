import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { generateAccessToken } from '~/utils/jwt-utils';
import * as crypto from 'crypto';
import { prisma } from '~/server/prisma';

//verifyHMAC doesn't return the same value as the crypto web API and I can't figure out why
const generateHMAC = async (req: NextApiRequest) => {
  const data = new TextEncoder().encode(
    `${req.method}__${req.url}__${
      typeof req.body !== 'string' ? JSON.stringify(req.body || {}) : req.body
    }__${req.headers['x-timestamp']}`,
  );

  const importedKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.HMAC_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const buffer = await crypto.subtle.sign('HMAC', importedKey, data);

  const digestArray = Array.from(new Uint8Array(buffer));
  const digestHex = digestArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return digestHex;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const calculatedHMAC = await generateHMAC(req);
    if (calculatedHMAC !== req.headers['x-zipper-hmac']) {
      return res.status(500).send({ error: 'invalid HMAC' });
    }
    const refreshToken = req.body.refreshToken;

    // Verify and decode the refresh token
    try {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SIGNING_SECRET!,
      ) as any;

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: decodedToken.sub },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      // Generate a new JWT token
      const newToken = generateAccessToken({
        userId: decodedToken.sub,
        profile: user,
        orgMemberships: user.organizationMemberships.map((mem) => ({
          organizationId: mem.organizationId,
          organization: {
            name: mem.organization.name,
            id: mem.organization.id,
            slug: mem.organization.slug,
          },
          pending: false,
          role: mem.role,
        })),
      });

      // Send the new token in the response
      res.status(200).json({ accessToken: newToken });
    } catch (error) {
      console.log(error);
      // If the token is invalid or expired, return an error response
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  } else {
    // Return an error for unsupported HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
