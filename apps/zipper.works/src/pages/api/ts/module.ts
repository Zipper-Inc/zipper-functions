import type { NextApiRequest, NextApiResponse } from 'next';
import * as eszip from '@deno/eszip';
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

  const filename = moduleUrl.substring(moduleUrl.lastIndexOf('/') + 1);
  const modulePath = moduleUrl.replace(filename, '');

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

  const didRedirect = moduleUrl !== rootModule.specifier;
  let handleRedirect: undefined | ((s: string) => string);
  if (didRedirect) {
    const filename = moduleUrl.substring(moduleUrl.lastIndexOf('/') + 1);
    const modulePath = moduleUrl.replace(filename, '');
    handleRedirect = (specifier: string) =>
      specifier.replace(specifier.replace(filename, ''), modulePath);
  }

  const bundle: Record<string, string> = {};

  await eszip.build([rootModule.specifier], async (specifierPassedIn) => {
    const specifier = handleRedirect ? handleRedirect(specifierPassedIn) : specifierPassedIn;

    if (specifier === rootModule.specifier) {
      bundle[specifier] = rootModule.content;
      return rootModule;
    } else {
      const mod = await getModule(specifier, buildCache);
      if (mod?.content) bundle[specifier] = mod.content;
      return mod;
    }
  });

  return res.status(200).send(JSON.stringify(bundle));
}
