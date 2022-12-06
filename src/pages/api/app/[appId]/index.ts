import { prisma } from '~/server/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const name = req.query['appId'] as string;
  const app = await prisma.app.findUnique({ where: { id: name } });
  if (!app) {
    res.status(400);
    return;
  }

  const version =
    app.lastDeploymentVersion || new Date(Date.now()).getTime().toString();

  res.send({ id: app.id, version });
}
