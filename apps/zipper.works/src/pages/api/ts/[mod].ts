import type { NextApiRequest, NextApiResponse } from 'next';
import * as eszip from '@deno/eszip';
import { BuildCache, getModule } from '~/utils/eszip-build-cache';
import { LoadResponseModule } from '@deno/eszip/types/loader';
import { createUrlFromRelativeUrl, getHost } from '@zipper/utils';

enum ModMode {
  Module = 'module',
  Bundle = 'bundle',
  Types = 'types',
}

const TYPES_HEADER = 'x-typescript-types';

const buildCache = new BuildCache();

/**
 * Rewrites URLs so that they live relative to the original module URL
 * i.e. if you import `deno.land/x/foo` and it redirects to `deno.land/x/foo@4.2.0`
 *
 * This makes sure that all references to `deno.land/x/foo@4.2.0`
 * are rewritten to `deno.land/x/foo` so that the editor can follow the relative paths
 */
function getRedirectReplacer({
  originalUrl: originalUrlPassedIn,
  redirectedUrl: redirectedUrlPassedIn,
}: {
  originalUrl: string;
  redirectedUrl: string;
}) {
  if (originalUrlPassedIn === redirectedUrlPassedIn) return;
  // get the end file, something like `mod.ts`

  const originalUrl = createUrlFromRelativeUrl(originalUrlPassedIn);
  const redirectedUrl = createUrlFromRelativeUrl(redirectedUrlPassedIn);

  const filename = originalUrl.pathname.substring(
    originalUrlPassedIn.lastIndexOf('/') + 1,
  );

  // remove the `mod.ts` from the original url
  const originalPath = originalUrl.pathname.replace(filename, '');
  // get equivalent path on the redirected url
  const redirectedPath = redirectedUrl.pathname.replace(filename, '');

  return (specifier: string) => specifier.replace(redirectedPath, originalPath);
}

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
  const replaceRedirect = getRedirectReplacer({
    originalUrl: moduleUrl,
    redirectedUrl: rootModule.specifier,
  });

  const bundle: Record<string, string> = {};

  await eszip.build([rootModule.specifier], async (specifier) => {
    const bundlePath = replaceRedirect ? replaceRedirect(specifier) : specifier;

    if (specifier === rootModule.specifier) {
      bundle[bundlePath] = rootModule.content;
      return rootModule;
    } else {
      const mod = await getModule(specifier, buildCache);
      if (mod?.content) bundle[bundlePath] = mod.content;
      return mod;
    }
  });

  return res
    .status(200)
    .setHeader('Content-Type', 'application/json')
    .send(JSON.stringify(bundle));
}

async function respondWithTypesBundle({
  moduleUrl,
  rootModule,
  typesLocation,
  res,
}: {
  moduleUrl: string;
  rootModule: LoadResponseModule;
  typesLocation: string;
  res: NextApiResponse;
}) {
  /**
   * The root URL where types live, taken from the X-Typescript-Types header
   */
  let typesRootUrl: string;
  try {
    typesRootUrl = new URL(typesLocation).toString();
  } catch (e) {
    typesRootUrl = new URL(typesLocation, moduleUrl).toString();
  }

  const replaceRedirect = getRedirectReplacer({
    originalUrl: typesRootUrl,
    redirectedUrl: moduleUrl,
  });

  const typesBundle: Record<string, string> = {};

  try {
    await eszip.build([typesRootUrl], async (specifier) => {
      if (specifier === typesRootUrl) {
        const mod = await getModule(typesRootUrl, buildCache);
        if (mod?.content) typesBundle[moduleUrl] = mod.content;
        return mod;
      } else {
        const typesUrl = replaceRedirect
          ? replaceRedirect(specifier)
          : specifier;

        const mod = await getModule(specifier, buildCache);
        if (mod?.content) typesBundle[typesUrl] = mod.content;
        return mod;
      }
    });
  } catch (e) {
    // Just respond with a regular bundle if types fail
    console.error(
      '[API/TS/[MOD].TS]',
      `(${moduleUrl})`,
      'Failed to bundle types, sending code bundle\n',
      e,
    );
    return respondWithBundle({ moduleUrl, rootModule, res });
  }

  return res
    .status(200)
    .setHeader('Content-Type', 'application/json')
    .send(JSON.stringify(typesBundle));
}

export default async function handler(
  { query: { mod, x } }: NextApiRequest,
  res: NextApiResponse,
) {
  let modMode = (Array.isArray(mod) ? mod[0] : mod) as ModMode;

  if (!modMode || !Object.values(ModMode).includes(modMode)) {
    return res.status(404).send('404 Not found');
  }

  if (!x) {
    return res.status(400).send('Missing module URL');
  }

  // commas are valid in URLs, so don't treat this as an array
  const moduleUrl = Array.isArray(x) ? x.join(',') : x;

  // @todo maybe change this?
  const preferTypes = true;
  let moduleUrlEnhanced = '';

  if (getHost(moduleUrl) === 'cdn.skypack.dev') {
    const url = new URL(moduleUrl);
    url.searchParams.set('dts', '');
    moduleUrlEnhanced = url.toString();
  }

  if (getHost(moduleUrl) === 'esm.sh') {
    const url = new URL(moduleUrl);
    url.searchParams.set('target', 'deno');
    url.searchParams.set('bundle', '');
  }

  const rootModule = await getModule(
    moduleUrlEnhanced || moduleUrl,
    buildCache,
  );

  if (!rootModule) return res.status(404).send('Module not found');

  const typesLocation = rootModule.headers?.[TYPES_HEADER] as string;

  if (preferTypes && typesLocation) {
    modMode = ModMode.Types;
  }

  switch (modMode) {
    case ModMode.Bundle:
      return respondWithBundle({
        moduleUrl,
        rootModule,
        res,
      });
    case ModMode.Types:
      return respondWithTypesBundle({
        moduleUrl,
        rootModule,
        typesLocation,
        res,
      });
    case ModMode.Module:
    default:
      return respondWithRawModule({ rootModule, res });
  }
}
