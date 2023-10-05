import { getSourceFileFromCode } from './parse-code';
import type { SourceFile } from 'ts-morph';

/**
 * import lodash from 'lodash' => esm.sh/lodash
 * import lodash from 'npm:lodash' => esm.sh/lodash
 * import { handler } from './main.ts' => this applet
 * import { handler } from '/hourglass-inc/ai-bot/src/main.ts' => 'https://zipper.dev/hourglass-inc/ai-bot/src/main.ts'
 */
export function rewriteImports({
  code = '',
  srcPassedIn,
}: {
  code?: string;
  srcPassedIn?: SourceFile;
} = {}) {
  if (!code) return code;

  const src = srcPassedIn || getSourceFileFromCode(code);
  src
    .getImportDeclarations()
    .forEach((i) => console.log('wtf', i.getModuleSpecifierValue()));
}
