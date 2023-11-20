import { NextApiHandler } from 'next';
import { getExtendedUserInfo } from '~/utils/boot-info-utils';

const handler: NextApiHandler = async (req, res) => {
  const data = await getExtendedUserInfo({ req });

  if (!data || data instanceof Error)
    return res
      .status(data.status || 500)
      .send({ ok: false, error: data?.message || 'Missing user info' });

  res.status(200).send({ ok: true, data });
};

export default handler;
