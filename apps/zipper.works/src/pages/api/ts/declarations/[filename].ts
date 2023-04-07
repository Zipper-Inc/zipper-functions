import type { NextApiRequest, NextApiResponse } from 'next';
import { readDenoTypes, readFrameworkFile } from '~/utils/read-file';

const DENO = 'deno.d.ts';
const ZIPPER = 'zipper.d.ts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.query.filename as string) {
    case DENO: {
      const src = await readDenoTypes();
      return res.setHeader('Content-Type', 'text/typescript').send(src);
    }
    case ZIPPER: {
      const src = await readFrameworkFile('zipper.d.ts');
      return res.setHeader('Content-Type', 'text/typescript').send(src);
    }
    default: {
      return res.status(404).send('404 Not Found');
    }
  }
}
