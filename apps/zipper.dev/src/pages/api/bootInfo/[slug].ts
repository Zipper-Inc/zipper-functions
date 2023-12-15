import { NOT_FOUND } from '@zipper/utils';
import { NextApiHandler } from 'next';
import { getBootInfoWithUserInfo } from '~/utils/boot-info-utils';

const handler: NextApiHandler = async (req, res) => {
  try {
    const data = await getBootInfoWithUserInfo(req, res);
    if (data?.app && (!data.app.requiresAuthToRun || data.app.canUserEdit)) {
      res.status(200).json({ ok: true, data });
    } else {
      res.status(404).json({ ok: false, error: NOT_FOUND });
    }
  } catch (e: any) {
    res
      .status(500)
      .json({ ok: false, error: e?.message || 'An error occured' });
  }
};

export default handler;
