import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyHmac } from '~/utils/verify-hmac';
import { upsertSecret } from '~/server/routers/secret.router';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { body, method, query, headers } = req;

  const jsonBody = body ? JSON.parse(body) : {};

  const hmac = headers['x-zipper-hmac'] as string;
  if (!hmac || !process.env.HMAC_SIGNING_SECRET) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (!verifyHmac(req, process.env.HMAC_SIGNING_SECRET)) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  console.log('[Zipper.env] HMAC verified');

  const { appId } = query;

  switch (method) {
    case 'POST': {
      if (!jsonBody.key || !jsonBody.value) {
        return res.status(400).json({ error: 'BAD_REQUEST' });
      }
      try {
        await upsertSecret(
          {
            key: jsonBody.key,
            appId: appId as string,
            value: jsonBody.value,
          },
          { userId: jsonBody.userId },
        );
        return res.status(200).json({ ok: true });
      } catch (e: any) {
        return res.status(500).json({ ok: false, error: e.message });
      }
    }
    default: {
      return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWOED' });
    }
  }
}
