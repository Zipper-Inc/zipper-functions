import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';

export default async function omniOrganizations(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // check auth

  const users = await prisma.user.findMany();

  return res.status(200).end(
    JSON.stringify({
      ok: true,
      data: { users },
    }),
  );
}
