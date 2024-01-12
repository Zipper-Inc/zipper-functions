/**
 * @url /api/bootInfo/baseUserInfo
 * This one is for returning the basics we know about a user
 */

import { UNAUTHORIZED } from '@zipper/utils';
import { NextApiHandler } from 'next';
import { getUserInfoFromRequest } from '~/utils/boot-info-utils';

const handler: NextApiHandler = async (req, res) => {
  try {
    const data = await getUserInfoFromRequest(req);
    if (data?.userId) return res.status(200).json({ ok: true, data });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, error: e?.message || 'Error getting user info' });
  }
  return res.status(401).json({ ok: false, error: UNAUTHORIZED });
};

export default handler;
