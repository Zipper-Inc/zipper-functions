import { decryptFromHex } from '@zipper/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
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

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: zipperAuthCode.userId },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    const accessToken = generateAccessToken({
      userId: zipperAuthCode.userId,
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

    const refreshToken = generateRefreshToken(zipperAuthCode.userId);

    res.send({ accessToken, refreshToken });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: 'invalid code' });
  }
}
