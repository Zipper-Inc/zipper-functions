import type { LoadResponseModule } from '@deno/eszip/esm/loader';
import type { NextRequest } from 'next/server';
import fetch from 'node-fetch';
import type { BuildCache, CacheRecord } from './eszip-build-cache';
import { parseCode } from './parse-code';

export const X_ZIPPER_ESZIP_BUILD_HEADER = 'X-Zipper-Eszip-Build';

export const TYPESCRIPT_CONTENT_HEADERS = {
  'content-type': 'text/typescript',
};

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
  return req.headers.get(X_ZIPPER_ESZIP_BUILD_HEADER) === 'true';
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
  return code.includes('import React from');
}

export function applyTsxHack(
  specifier: string,
  code = '/* 🤷🏽‍♂️ missing code */',
  shouldAddJsxPragma = true,
): LoadResponseModule {
  return {
    // Add TSX to all files so they support JSX
    specifier: specifier.replace(/\.(ts|tsx)$|$/, '.tsx'),
    headers: TYPESCRIPT_CONTENT_HEADERS,
    content:
      !codeHasReact(code) && shouldAddJsxPragma ? addJsxPragma(code) : code,
    kind: 'module',
  };
}

export async function getModule(specifier: string, buildCache?: BuildCache) {
  const shouldUseCache = !!buildCache && !isZipperImportUrl(specifier);

  if (shouldUseCache) {
    const cachedModule = await buildCache.get(specifier);
    if (cachedModule) return cachedModule;
  }

  const response = await fetch(specifier, {
    headers: {
      [X_ZIPPER_ESZIP_BUILD_HEADER]: 'true',
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

  if (shouldUseCache) await buildCache.set(specifier, mod);

  return mod;
}
