import { NextApiRequest, NextApiResponse } from 'next';

export default async function omniUserCreate(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // check auth

  // get inputs
  // console.log(await req.body.json());

  // create prisma

  // return the created user object

  return res.status(501).end(
    JSON.stringify({
      ok: false,
      called: 'omni/user/create not yet implemented',
    }),
  );
}
