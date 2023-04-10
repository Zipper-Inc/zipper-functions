import type { NextApiRequest, NextApiResponse } from 'next';
import * as eszip from '@deno/eszip';
import { BuildCache, getModule } from '~/utils/eszip-build-cache';
import { LoadResponseModule } from '@deno/eszip/types/loader';

const buildCache = new BuildCache();

function respondWithRawModule({
  rootModule,
  res,
}: {
  rootModule: LoadResponseModule;
  res: NextApiResponse;
}) {
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

async function respondWithBundle({
  moduleUrl,
  rootModule,
  res,
}: {
  moduleUrl: string;
  rootModule: LoadResponseModule;
  res: NextApiResponse;
}) {
  const didRedirect = moduleUrl !== rootModule.specifier;
  let handleRedirect: undefined | ((s: string) => string);

  if (didRedirect) {
    // get the end file, something like `mod.ts`
    const filename = moduleUrl.substring(moduleUrl.lastIndexOf('/') + 1);
    // remove the `mod.ts` from the original url
    const originalPath = moduleUrl.replace(filename, '');
    // get equivalent path on the redirected url
    const redirectedPath = rootModule.specifier.replace(filename, '');

    handleRedirect = (specifier: string) =>
      specifier.replace(redirectedPath, originalPath);
  }

  const bundle: Record<string, string> = {};

  await eszip.build([rootModule.specifier], async (specifier) => {
    const bundlePath = handleRedirect ? handleRedirect(specifier) : specifier;

    if (specifier === rootModule.specifier) {
      bundle[bundlePath] = rootModule.content;
      return rootModule;
    } else {
      const mod = await getModule(specifier, buildCache);
      if (mod?.content) bundle[bundlePath] = mod.content;
      return mod;
    }
  });

  return res.status(200).send(JSON.stringify(bundle));
}

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

  return shouldBundle
    ? respondWithBundle({ moduleUrl, rootModule, res })
    : respondWithRawModule({ rootModule, res });
}
