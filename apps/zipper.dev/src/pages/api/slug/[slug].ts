import { prisma } from '~/server/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slug = req.query['slug'] as string;
  const app = await prisma.app.findUnique({ where: { slug } });
  if (!app) {
    res.status(400).send('App not found');
    return;
  }

  const version =
    app.lastDeploymentVersion || new Date(Date.now()).getTime().toString();

  res.send({ id: app.id, version });
}
