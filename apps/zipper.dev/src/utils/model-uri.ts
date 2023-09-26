import { type Uri } from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * In Deno, imports look like `import { foo } from './foo.ts'`
 * In regular Typescript, they look like `import { foo } from './foo'`
 *
 * In order to make intellisense work, enable JSX, and allow file extension imports
 * we append `.tsx` to so that internally, Monaco thinks its `foo.ts.tsx`
 * Super weird, but its the only way to have cake and eat it too. 🍰
 */
type DENO_REQUIRED_FILE_EXTENSION = 'ts' | 'tsx';

/**
 * Create a Monaco-friendly model URI from a Deno import path
 * You have to pass in `monaco.Uri.parse` because loading monaco has all kinds of side effects
 */
export const getUriFromPath = (
  path: string,
  parseFn: (path: string) => Uri,
  extension: DENO_REQUIRED_FILE_EXTENSION,
) => {
  if (path.endsWith('md')) return parseFn(`${path}`);
  if (path.endsWith('md') || path.endsWith('json')) return parseFn(`${path}`);
  return parseFn(`${path}.${extension}`);
};

/**
 * Get a Deno-friendly import path from a Monaco model URI
 */
export const getPathFromUri = (uri: Uri): string => {
  return uri.path.replace(/\.tsx?$/, '');
};
