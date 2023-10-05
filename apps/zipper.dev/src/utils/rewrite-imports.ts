import { SourceFile } from 'ts-morph';
import { getSourceFileFromCode, isExternalImport } from './parse-code';

const DEFAULT_NPM_CDN = 'https://esm.sh';
const withNpmCdn = (specifier: string) => `${DEFAULT_NPM_CDN}/${specifier}`;

function rewriteSpecifier(specifier: string) {
  // Don't touch file imports or urls
  if (
    specifier.startsWith('./') ||
    specifier.startsWith('../') ||
    isExternalImport(specifier)
  ) {
    return specifier;
  }

  // Treat the root like the root of zipper.dev
  if (specifier.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL}/${specifier}`;
  }

  // Fix the npm ones
  if (specifier.startsWith('npm:')) {
    return withNpmCdn(specifier.replace('npm:', ''));
  }

  /** @todo */
  // handle `node:` imports
  // Maybe we can just use the CDN for those too?

  // Assume everthing else is from npm
  return withNpmCdn(specifier);
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
