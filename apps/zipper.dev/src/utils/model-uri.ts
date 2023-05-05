import { type Uri } from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * In Deno, imports look like `import { foo } from './foo.ts'`
 * In regular Typescript, they look like `import { foo } from './foo'`
 *
 * In order to make intellisense work and let you write file extensions,
 * we append another `.ts` to so that internally, Monaco thinks its `foo.ts.ts`
 * Super weird, but its the only way to have cake and eat it too. 🍰
 */
const DENO_FRIENDLY_SUFFIX = '.ts';

/**
 * Create a Monaco-friendly model URI from a Deno import path
 * You have to pass in `monaco.Uri.parse` because loading monaco has all kinds of side effects
 */
export const getUriFromPath = (path: string, parseFn: (path: string) => Uri) =>
  parseFn(`${path}${DENO_FRIENDLY_SUFFIX}`);

/**
 * Get a Deno-friendly import path from a Monaco model URI
 */
export const getPathFromUri = (uri: Uri) => {
  return uri.path.replace(new RegExp(`${DENO_FRIENDLY_SUFFIX}$`), '');
};
