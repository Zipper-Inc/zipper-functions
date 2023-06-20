import { NextApiRequest, NextApiResponse } from 'next';

export default async function omniOrganizationIndex(
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
      called: 'omni/organization/[id] not yet implemented',
    }),
  );
}
