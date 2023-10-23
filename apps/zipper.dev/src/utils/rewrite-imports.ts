import type { SourceFile } from 'ts-morph';
/** This has to use the server version or build may break */
import { getZipperDotDevUrlForServer } from '~/server/utils/server-url.utils';
import { getSourceFileFromCode, isExternalImport } from './parse-code';

const ESM_SH_ORIGN = 'https://esm.sh';
const SKYPACK_ORIGIN = 'https://cdn.skypack.dev';

const withDenoTarget = (specifier: string) => {
  try {
    const url = new URL(specifier);
    if (url.origin === ESM_SH_ORIGN && !url.searchParams.has('target'))
      url.searchParams.set('target', 'deno');

    if (url.origin === SKYPACK_ORIGIN && !url.searchParams.has('dts'))
      url.searchParams.set('dts', '1');

    return url.toString();
  } catch (e) {
    return specifier;
  }
};

const withEsmSh = (specifier: string) =>
  withDenoTarget(`${ESM_SH_ORIGN}/${specifier}`);

export const LOCALHOST_URL_REGEX =
  /^(?:https?:\/\/)(?:localhost|127\.0\.0\.1|10\.(?:\d{1,3}\.){2}\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.){1}\d{1,3}|::1)(?:\:\d+)?/;

export enum RewriteTo {
  None,
  ZipperDotDev,
  EsmSh,
  External,
}

/**
 * Rewrite certain imports to enable special Zipper use cases
 *
 * | Specifier | Rewrite To |
 * | --------- | ----------|
 * | ./whatever.ts | ./whatever.ts |
 * | https://deno.land/x/whatever/mod.ts | https://deno.land/x/whatever/mod.ts |
 * | /hourglass-inc/hr-utils/src/main.ts | https://zipper.dev/hourglass-inc/hr-utils/src/main.ts |
 * | npm:lodash | https://esm.sh/lodash?target=deno |
 * | node:fs | https://esm.sh/fs?target=deno |
 * | lodash | https://esm.sh/lodash?target=deno |
 */
export function getRewriteRule(specifier: string): RewriteTo {
  // Someone clever might try to sniff out the server URL
  // Extend the metaphor by making it just be zipper.dev
  if (specifier.startsWith('/') || LOCALHOST_URL_REGEX.test(specifier)) {
    return RewriteTo.ZipperDotDev;
  }

  if (!specifier || specifier.startsWith('./') || specifier.startsWith('../')) {
    return RewriteTo.None;
  }

  if (isExternalImport(specifier)) {
    return RewriteTo.External;
  }

  if (specifier.startsWith('npm:') || specifier.startsWith('node:')) {
    return RewriteTo.EsmSh;
  }

  // default to npm
  return RewriteTo.EsmSh;
}

export function rewriteSpecifier(
  specifier: string,
  rule = getRewriteRule(specifier),
) {
  switch (rule) {
    case RewriteTo.None:
      return specifier;

    case RewriteTo.External:
      return withDenoTarget(specifier);

    case RewriteTo.ZipperDotDev:
      return `${getZipperDotDevUrlForServer()}${specifier
        .replace(LOCALHOST_URL_REGEX, '')
        .replace(/^\//, '')}`;

    case RewriteTo.EsmSh:
    default:
      return withEsmSh(specifier.replace(/^(npm|node):/, ''));
  }
}

export function rewriteImports(src?: string | SourceFile) {
  if (!src) return src;

  const sourceFile = typeof src == 'string' ? getSourceFileFromCode(src) : src;

  sourceFile
    .getImportDeclarations()
    .forEach((i) =>
      i.setModuleSpecifier(rewriteSpecifier(i.getModuleSpecifierValue())),
    );

  return sourceFile.getFullText();
}
