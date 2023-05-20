import { JwtPayload, verify } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(500).send({ ok: false });
    return;
  }

  try {
    const auth = verify(token, process.env.JWT_SIGNING_SECRET!) as JwtPayload;

    if (!auth || !auth.sub) {
      res.status(500).send({ ok: false });
      return;
    }

    await prisma.appConnectorUserAuth.delete({
      where: {
        appId_connectorType_userIdOrTempId: {
          appId: req.query.appId as string,
          connectorType: req.query.type as string,
          userIdOrTempId: auth.sub,
        },
      },
    });

    res.status(200).send({ ok: true });

    return;
  } catch (e) {
    res.status(500).send({ ok: false });
    return;
  }
}
