import { LoadResponseModule } from '@deno/eszip/types/loader';

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

export function addJsxPragma(code: string) {
  return code.replace(
    /^/,
    '/** @jsx Zipper.JSX.createElement @jsxFrag Zipper.JSX.Fragment */',
  );
}

export function applyTsxHack(
  specifier: string,
  code = '/* 🤷🏽‍♂️ missing code */',
  shouldAddJsxPragma = true,
) {
  return {
    // Add TSX to all files so they support JSX
    specifier: specifier.replace(/\.(ts|tsx)$|$/, '.tsx'),
    headers: TYPESCRIPT_CONTENT_HEADERS,
    content: shouldAddJsxPragma ? addJsxPragma(code) : code,
    kind: 'module',
  } as LoadResponseModule;
}
