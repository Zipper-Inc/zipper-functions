import fs from 'fs/promises';
import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import path from 'path';
import { generateHandlersForFramework } from '@zipper/utils';

/**
 * @todo
 * Bundle this up or put this source somewhere else
 * Totally possible that the directory structure cannot be guaranteed
 */
export const FRAMEWORK_PATH = path.resolve(
  '../..',
  'packages/deno-zipper-framework',
);
export const FRAMEWORK_ENTRYPOINT = 'app.ts';
export const HANDLERS_PATH = 'generated/handlers.gen.ts';
export const TYPESCRIPT_CONTENT_HEADERS = {
  'content-type': 'text/typescript',
};

function buildLog(msg: string, depth = 0) {
  console.log('[ESZIP]', ...Array(depth).fill('>'), msg);
}

export async function build({
  baseUrl,
  app,
  version,
}: {
  baseUrl: string;
  app: App & { scripts: Script[] };
  version: string;
}) {
  const startMs = performance.now();
  const appName = `${app.name}@${version}`;

  buildLog(`Building ${appName} for deployment`);

  const appFilesBaseUrl = `${baseUrl}/src`;
  const frameworkEntrypointUrl = `${baseUrl}/${FRAMEWORK_ENTRYPOINT}`;
  const appFileUrls = app.scripts.map(
    ({ filename }) => `${appFilesBaseUrl}/${filename}`,
  );
  const fileUrlsToBundle = [frameworkEntrypointUrl, ...appFileUrls];

  const bundle = await eszip.build(fileUrlsToBundle, async (specifier) => {
    buildLog(`Resolving ${specifier}`, 1);

    /**
     * Handle user's App files
     */
    if (specifier.startsWith(appFilesBaseUrl)) {
      const filename = specifier.replace(`${appFilesBaseUrl}/`, '');
      const script = app.scripts.find((s) => s.filename === filename);

      buildLog(`Adding \`${filename}\` from ${appName}`, 2);

      return {
        specifier,
        headers: TYPESCRIPT_CONTENT_HEADERS,
        content: script?.code || '/* missing code */',
        kind: 'module',
        version,
      };
    }

    /**
     * Handle Zipper Framework Files
     */
    if (specifier.startsWith(baseUrl)) {
      const filename = specifier.replace(`${baseUrl}/`, '');
      const isHandlersPath = filename === HANDLERS_PATH;

      buildLog(
        isHandlersPath
          ? `Generating new routes at \`${filename}\``
          : `Copying \`${filename}\` from framework`,
        2,
      );

      const content = await fs.readFile(
        path.resolve(FRAMEWORK_PATH, filename),
        'utf8',
      );

      return {
        kind: 'module',
        specifier,
        headers: TYPESCRIPT_CONTENT_HEADERS,
        content: isHandlersPath
          ? generateHandlersForFramework({
              code: content,
              filenames: app.scripts.map((s) => s.filename),
            })
          : content,
      };
    }

    /**
     * Handle remote imports
     * @todo caching strategy to avoid a fetch?
     */
    const response = await fetch(specifier, { redirect: 'follow' });
    if (response.status !== 200) {
      // ensure the body is read as to not leak resources
      await response.arrayBuffer();
      return undefined;
    }

    const content = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return {
      kind: 'module',
      specifier: response.url,
      headers,
      content,
    };
  });

  const elapsedMs = performance.now() - startMs;
  buildLog(`Built ${app.name}@${version} in ${Math.round(elapsedMs)}ms`);

  return bundle;
}
