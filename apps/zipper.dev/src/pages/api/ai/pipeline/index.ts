import { NextApiRequest, NextApiResponse } from 'next';
import { createCodeChain, parseCodeOutput } from '~/utils/ai-generate-applet';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = JSON.parse(req.body);
  const { userRequest } = body;

  try {
    const { auditedCode } = await createCodeChain.call({ userRequest });
    const generatedCode = parseCodeOutput(auditedCode);
    return res.status(200).json({ code: generatedCode });
  } catch {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
