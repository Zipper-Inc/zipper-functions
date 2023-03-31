import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(500).send({ ok: false });
    return;
  }

  await prisma.appConnectorUserAuth.delete({
    where: {
      appId_connectorType_userIdOrTempId: {
        appId: req.query.appId as string,
        connectorType: req.query.type as string,
        userIdOrTempId: userId,
      },
    },
  });

  res.status(200).send({ ok: true });

  return;
}
