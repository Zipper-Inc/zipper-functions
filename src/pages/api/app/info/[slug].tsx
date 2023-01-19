import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slugFromUrl = req.query?.slug as string;

  const app = await prisma.app.findUnique({
    where: { slug: slugFromUrl },
  });

  if (!app) return res.status(404).send({ ok: false, error: 'not_found' });

  /**
   * @todo
   * - security of some sort (control access for users)
   * - restrict endpoint to run server)
   * - send over inputs from code
   */

  return res.status(200).send({ ok: true, data: { app, inputs: [] } });
}
