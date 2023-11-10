import type { LoadResponseModule } from '@deno/eszip/esm/loader';
import type { NextRequest } from 'next/server';
import fetch from 'node-fetch';
import type { BuildCache, CacheRecord } from './eszip-build-cache';
import type { Target } from './rewrite-imports';

export const X_ZIPPER_ESZIP_BUILD = 'x-zipper-eszip-build';

export const TYPESCRIPT_CONTENT_HEADERS = {
  'content-type': 'text/typescript',
};

const X_ZIPPER_ESZIP_BUILD_HEADER = { [X_ZIPPER_ESZIP_BUILD]: 'true' };
export const DENO_USER_AGENT_HEADER = { 'user-agent': 'Deno/1.32.0' };

export const MARKDOWN_CONTENT_HEADERS = {
  'content-type': 'text/markdown',
};

export function isZipperImportUrl(specifier: string) {
  try {
    const url = new URL(specifier);
    return [
      'zipper.run',
      'zipper.dev',
      process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST,
      process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST,
    ].find((host) => host && url.host.endsWith(host))
      ? true
      : false;
  } catch (e) {
    return false;
  }
}

export function hasZipperEszipHeader(req: NextRequest) {
  return req.headers.get(X_ZIPPER_ESZIP_BUILD) === 'true';
}

export function addJsxPragma(code: string) {
  return code.replace(
    /^/,
    '/** @jsx Zipper.JSX.createElement @jsxFrag Zipper.JSX.Fragment */',
  );
}

// tried ts-morph but it doesn't work here for some reason
// this is fine for now...
export function codeHasReact(code: string) {
  return /^import\s+.*React,?.*\s+from/m.test(code);
}

export function handleJSXModule(
  specifier: string,
  code = '/* 🤷🏽‍♂️ missing code */',
  shouldAddJsxPragma = true,
): LoadResponseModule {
  return {
    specifier,
    headers: TYPESCRIPT_CONTENT_HEADERS,
    content:
      specifier.endsWith('.tsx') && shouldAddJsxPragma
        ? addJsxPragma(code)
        : code,
    kind: 'module',
  };
}

export async function getRemoteModule({
  specifier,
  buildCache,
  target,
}: {
  specifier: string;
  buildCache?: BuildCache;
  target?: Target;
}) {
  const shouldUseCache = !!buildCache && !isZipperImportUrl(specifier);

  if (shouldUseCache) {
    const cachedModule = await buildCache.get([specifier, target]);
    if (cachedModule) return cachedModule;
  }

  const response = await fetch(specifier, {
    headers: {
      ...X_ZIPPER_ESZIP_BUILD_HEADER,
      ...DENO_USER_AGENT_HEADER,
    },
    redirect: 'follow',
  });

  if (response.status !== 200) {
    // ensure the body is read as to not leak resources
    await response.arrayBuffer();
    return undefined;
  }

  const content = await response.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const mod = {
    kind: 'module',
    specifier: response.url,
    headers,
    content,
  } as CacheRecord['module'];

  if (shouldUseCache) await buildCache.set([specifier, target], mod);

  return mod;
}
