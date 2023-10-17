import type { SourceFile } from 'ts-morph';
/** This has to use the server version or build may break */
import { getZipperDotDevUrlForServer } from '~/server/utils/server-url.utils';
import { getSourceFileFromCode, isExternalImport } from './parse-code';

const DEFAULT_NPM_CDN = 'https://esm.sh';
const withNpmCdn = (specifier: string) => `${DEFAULT_NPM_CDN}/${specifier}`;
export const LOCALHOST_URL_REGEX =
  /^(?:https?:\/\/)(?:localhost|127\.0\.0\.1|10\.(?:\d{1,3}\.){2}\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.){1}\d{1,3}|::1)(?:\:\d+)?/;

export enum RewriteTo {
  None,
  ZipperDotDev,
  NpmCdn,
}

/**
 * Rewrite certain imports to enable special Zipper use cases
 *
 * | Specifier | Rewrite To |
 * | --------- | ----------|
 * | ./whatever.ts | ./whatever.ts |
 * | https://deno.land/x/whatever/mod.ts | https://deno.land/x/whatever/mod.ts |
 * | /hourglass-inc/hr-utils/src/main.ts | https://zipper.dev/hourglass-inc/hr-utils/src/main.ts |
 * | npm:lodash | https://esm.sh/lodash |
 * | node:fs | https://esm.sh/fs |
 * | lodash | https://esm.sh/lodash |
 */
export function getRewriteRule(specifier: string): RewriteTo {
  // Someone clever might try to sniff out the server URL
  // Extend the metaphor by making it just be zipper.dev
  if (specifier.startsWith('/') || LOCALHOST_URL_REGEX.test(specifier)) {
    return RewriteTo.ZipperDotDev;
  }

  if (
    !specifier ||
    specifier.startsWith('./') ||
    specifier.startsWith('../') ||
    isExternalImport(specifier)
  ) {
    return RewriteTo.None;
  }

  if (specifier.startsWith('npm:') || specifier.startsWith('node:')) {
    return RewriteTo.NpmCdn;
  }

  // default to npm
  return RewriteTo.NpmCdn;
}

export function rewriteSpecifier(
  specifier: string,
  rule = getRewriteRule(specifier),
) {
  switch (rule) {
    case RewriteTo.None:
      return specifier;

    case RewriteTo.ZipperDotDev:
      return `${getZipperDotDevUrlForServer()}${specifier
        .replace(LOCALHOST_URL_REGEX, '')
        .replace(/^\//, '')}`;

    case RewriteTo.NpmCdn:
    default:
      return withNpmCdn(specifier.replace(/^(npm|node):/, ''));
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
