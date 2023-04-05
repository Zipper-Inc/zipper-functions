import { Uri } from 'vscode';

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
 */
export const getUriFromPath = (path: string) =>
  Uri.parse(`${path}${DENO_FRIENDLY_SUFFIX}`);

/**
 * Get a Deno-friendly import path from a Monaco model URI
 */
export const getPathFromUri = (uri: Uri) => {
  return uri.path.replace(new RegExp(`${DENO_FRIENDLY_SUFFIX}$`), '');
};
