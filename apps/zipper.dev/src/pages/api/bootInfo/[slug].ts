import { NextApiHandler } from 'next';
import { getBootInfoWithUserInfo } from '~/utils/boot-info-utils';

const handler: NextApiHandler = async (req, res) => {
  const data = await getBootInfoWithUserInfo(req, res);
  res.status(200).send({ ok: true, data });
};

export default handler;
