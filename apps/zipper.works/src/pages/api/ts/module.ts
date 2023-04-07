import type { NextApiRequest, NextApiResponse } from 'next';
import { BuildCache, getModule } from '~/utils/eszip-build-cache';

const buildCache = new BuildCache();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!req.query.x) {
    return res.status(400).send('Missing module URL');
  }

  const shouldBundle = req.query.bundle !== undefined;

  // commas are valid in URLs, so don't treat this as an array
  const moduleUrl = Array.isArray(req.query.x)
    ? req.query.x.join(',')
    : req.query.x;

  const rootModule = await getModule(moduleUrl, buildCache);

  if (!rootModule) return res.status(404).send('Module not found');

  // If there is no bundle param, just return the module
  if (!shouldBundle) {
    if (rootModule.headers) {
      Object.keys(rootModule.headers).forEach((k) =>
        res.setHeader(k, rootModule.headers?.[k] || ''),
      );
    }

    return res
      .status(200)
      .setHeader('Content-Type', 'text/typescript')
      .send(rootModule.content);
  }

  return res.status(501).send('bundle not setup');
}
