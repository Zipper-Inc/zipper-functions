import { authorize } from '@liveblocks/node';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

const { LIVEBLOCKS_SECRET_KEY } = process.env;

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  if (!LIVEBLOCKS_SECRET_KEY) {
    return res.status(500).send({
      error: 'Missing secret',
    });
  }

  const token = await getToken({ req });

  if (!token?.sub) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const response = await authorize({
    room: req.body.room,
    secret: LIVEBLOCKS_SECRET_KEY,
    userId: token.sub,
  });

  return res.status(response.status).end(response.body);
}
