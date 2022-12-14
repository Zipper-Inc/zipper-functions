import { authorize } from '@liveblocks/node';
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAPIAuth } from '~/utils/verifyAuth';

const { LIVEBLOCKS_SECRET_KEY } = process.env;

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  if (!LIVEBLOCKS_SECRET_KEY) {
    return res.status(500).send({
      error: 'Missing secret',
    });
  }

  let userId;

  try {
    userId = await verifyAPIAuth(req, res);
  } catch (e) {
    // Handle anonymous public users
    /**
     * @todo check if app is pif (app?.isPublic) userId = `anon-${randomUUID()}`;
     */
    userId = null;
  }

  if (!userId) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const response = await authorize({
    room: req.body.room,
    secret: LIVEBLOCKS_SECRET_KEY,
    userId,
  });

  return res.status(response.status).end(response.body);
}
