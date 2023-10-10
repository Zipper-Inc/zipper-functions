import { deleteCookie } from 'cookies-next';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  deleteCookie('__zipper_token', { req, res });
  deleteCookie('__zipper_refresh', { req, res });

  res.status(200).json({ success: true });
}
