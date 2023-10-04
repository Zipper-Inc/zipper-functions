import { authorize } from '@liveblocks/node';
import { NextApiRequest, NextApiResponse } from 'next';
import { createContext } from '~/server/context';
import { prisma } from '~/server/prisma';
import { canUserEdit } from '~/server/routers/app.router';

const { LIVEBLOCKS_SECRET_KEY } = process.env;

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  if (!LIVEBLOCKS_SECRET_KEY) {
    return res.status(500).send({
      error: 'Missing secret',
    });
  }

  const context = await createContext({ req, res });

  if (!context.userId) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const [, appSlug] = req.body.room.split('/') as [string, string];
  const applet = await prisma.app.findUnique({
    where: { slug: appSlug },
    include: { editors: true },
  });

  if (!applet) {
    return res.status(404).send({ error: 'Applet not found' });
  }

  if (!canUserEdit(applet, context)) {
    return res.status(403).send({ error: 'Forbidden' });
  }

  const response = await authorize({
    room: req.body.room,
    secret: LIVEBLOCKS_SECRET_KEY,
    userId: context.userId,
  });

  return res.status(response.status).end(response.body);
}
