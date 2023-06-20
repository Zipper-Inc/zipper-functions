import { User } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { PrismaAdapter } from '../../auth/[...nextauth]';

export default async function omniUserCreate(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // check auth

  // get inputs
  // console.log(await req.body.json());

  // create prisma
  const { createUser } = PrismaAdapter(prisma);
  const data = (await req.body) as Omit<User, 'id'>;
  console.log(data);
  try {
    const user = await createUser(data);
    // return the created user object

    return res.status(200).end(
      JSON.stringify({
        ok: true,
        data: { user },
      }),
    );
  } catch (e) {
    return res.status(500).end(
      JSON.stringify({
        ok: false,
        error: `Could not create user. ${e?.toString()}`,
      }),
    );
  }
}
