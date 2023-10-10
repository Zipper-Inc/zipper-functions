import type { SourceFile } from 'ts-morph';
/** This has to use the server version or build may break */
import { getZipperDotDevUrlForServer } from '~/server/utils/server-url.utils';
import { getSourceFileFromCode, isExternalImport } from './parse-code';

const DEFAULT_NPM_CDN = 'https://esm.sh';
const withNpmCdn = (specifier: string) => `${DEFAULT_NPM_CDN}/${specifier}`;

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
  if (
    specifier.startsWith('./') ||
    specifier.startsWith('../') ||
    isExternalImport(specifier)
  ) {
    return RewriteTo.None;
  }

  if (specifier.startsWith('/')) return RewriteTo.ZipperDotDev;
  if (specifier.startsWith('npm:')) return RewriteTo.NpmCdn;
  if (specifier.startsWith('node:')) return RewriteTo.NpmCdn;

  // default to npm
  return RewriteTo.NpmCdn;
}

export function rewriteSpecifier(specifier: string) {
  switch (getRewriteRule(specifier)) {
    case RewriteTo.None:
      return specifier;

    case RewriteTo.ZipperDotDev:
      return `${getZipperDotDevUrlForServer()}${specifier.replace(/^\//, '')}`;

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
