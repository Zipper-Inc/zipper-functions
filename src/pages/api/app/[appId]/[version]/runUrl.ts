import { createHmac } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '~/server/env';
import { verifyAPIAuth } from '~/utils/verifyAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await verifyAPIAuth(req, res);
  } catch (error) {
    res.status(401).send({ error: 'Unauthorized' });
  }
  const { query } = req;

  const appId = query.appId as string;
  const version = query.version as string;

  const timestamp = Date.now();

  const urlInfo = {
    timestamp: timestamp,
    hmac: createHmac('sha256', env.RELAY_HMAC_SIGING_SECRET)
      .update(`GET/${timestamp.toString()}/${appId}/${version}`)
      .digest('hex'),
    url: `/run/${appId}@${version}`,
  };

  res.json(urlInfo);
}
