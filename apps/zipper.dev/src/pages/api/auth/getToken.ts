import { decryptFromHex } from '@zipper/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import * as jwt from 'jsonwebtoken';
import clerkClient from '@clerk/clerk-sdk-node';

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
      where: { code, used: false },
    });

    await prisma.zipperAuthCode.update({
      where: { code },
      data: {
        used: true,
      },
    });

    const user = await clerkClient.users.getUser(zipperAuthCode.userId);
    const orgs = await clerkClient.users.getOrganizationMembershipList({
      userId: zipperAuthCode.userId,
    });

    const accessToken = jwt.sign(
      {
        sub: zipperAuthCode.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryEmail: user.emailAddresses.find((e) => {
          e.id === user.primaryEmailAddressId;
        }),
        organizations: orgs.map((o) => {
          return { [o.id]: o.role };
        }),
      },
      process.env.JWT_SIGNING_SECRET!,
      { expiresIn: '1h' },
    );

    const refreshToken = jwt.sign(
      { sub: zipperAuthCode.userId },
      process.env.JWT_REFRESH_SIGNING_SECRET!,
      { expiresIn: '7d' },
    );

    res.send({ accessToken, refreshToken });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: 'invalid code' });
  }
}
