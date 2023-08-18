import { NextApiRequest, NextApiResponse } from 'next';
import { createCodeChain } from '~/utils/ai-generate-applet';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return res.status(200).json({
    code: await createCodeChain.call({
      userRequest: 'Applet that sums numbers up to N',
    }),
  });
}
