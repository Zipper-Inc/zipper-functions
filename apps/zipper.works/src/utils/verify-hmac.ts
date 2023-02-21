import { createHmac, timingSafeEqual } from 'crypto';
import { NextApiRequest } from 'next';

export function verifyHmac(req: NextApiRequest, signingSecret: string) {
  const hmac = req.headers['x-zipper-hmac'] as string;
  if (!hmac) {
    console.log('No hmac header');
    return false;
  }
  const timestamp = req.headers['x-timestamp'];
  if (!timestamp) {
    console.log('No timestamp header');
    return false;
  }

  if (Math.abs(Date.now() - Number(timestamp)) > 1000 * 30) {
    console.log('Timestamp expired');
    return false;
  }

  const calculatedHmac = createHmac('sha256', signingSecret)
    .update(
      `${req.method}__${req.url}__${
        req.body || JSON.stringify({})
      }__${timestamp}`,
    )
    .digest('hex');

  return timingSafeEqual(Buffer.from(calculatedHmac), Buffer.from(hmac));
}
