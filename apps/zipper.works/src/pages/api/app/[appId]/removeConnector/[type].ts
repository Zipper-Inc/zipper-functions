import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('HERE');
  console.log(req.headers);
  const { userId } = getAuth(req);
  console.log(userId);
  if (!userId) {
    res.status(500).send({ ok: false });
    return;
  }

  const auth = await prisma.appConnectorUserAuth.delete({
    where: {
      appId_connectorType_userIdOrTempId: {
        appId: req.query.appId as string,
        connectorType: req.query.type as string,
        userIdOrTempId: userId,
      },
    },
  });

  console.log(auth);

  res.status(200).send({ ok: true });

  return;
}
