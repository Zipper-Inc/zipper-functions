import { type Uri } from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Create a Monaco-friendly model URI from a Deno import path
 * You have to pass in `monaco.Uri.parse` because loading monaco has all kinds of side effects
 *
 * In Deno, imports look like `import { foo } from './foo.ts'`
 * In regular Typescript, they look like `import { foo } from './foo'`
 *
 * In order to make intellisense work, enable JSX, and allow file extension imports
 * we append `.tsx` to so that internally, Monaco thinks its `foo.ts.tsx`
 * Super weird, but its the only way to have cake and eat it too. 🍰
 */
export const getUriFromPath = (
  path: string,
  parseFn: (path: string) => Uri,
  extension: string,
) => {
  if (path.endsWith('md') || extension === 'md') return parseFn(`${path}`);
  return parseFn(`${path}.${extension}`);
};

/**
 * Get a Deno-friendly import path from a Monaco model URI
 */
export const getPathFromUri = (uri: Uri): string => {
  return uri.path.replace(/\.tsx?$|.ts?$/, '');
};
