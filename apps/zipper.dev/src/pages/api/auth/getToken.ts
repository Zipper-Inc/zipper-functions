import { decryptFromHex } from '@zipper/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import clerkClient from '@clerk/clerk-sdk-node';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = JSON.parse(req.body);
  const encryptedCode = body.code;

  if (!encryptedCode) res.status(500).send({ error: 'Missing code' });

  try {
    const code = decryptFromHex(encryptedCode, process.env.ENCRYPTION_KEY);
    const zipperAuthCode = await prisma.zipperAuthCode.findFirstOrThrow({
      where: { code, used: false, expiresAt: { gte: Date.now() } },
    });

    await prisma.zipperAuthCode.update({
      where: { code },
      data: {
        used: true,
      },
    });

    const user = await clerkClient.users.getUser(zipperAuthCode.userId);
    const orgMems = await clerkClient.users.getOrganizationMembershipList({
      userId: zipperAuthCode.userId,
    });

    const accessToken = generateAccessToken({
      userId: zipperAuthCode.userId,
      profile: user,
      orgMemberships: orgMems,
    });

    const refreshToken = generateRefreshToken(zipperAuthCode.userId);

    res.send({ accessToken, refreshToken });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: 'invalid code' });
  }
}
