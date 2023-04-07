import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import { generateHandlersForFramework } from '@zipper/utils';
import { BuildCache, getModule } from './eszip-build-cache';
import { readFrameworkFile, FRAMEWORK_INTERNAL_PATH } from './read-file';

/**
 * @todo
 * Bundle this up or put this source somewhere else
 * Totally possible that the directory structure cannot be guaranteed
 */

export const FRAMEWORK_ENTRYPOINT = 'app.ts';
export const HANDLERS_PATH = 'generated/handlers.gen.ts';
export const TYPESCRIPT_CONTENT_HEADERS = {
  'content-type': 'text/typescript',
};

const buildCache = new BuildCache();

const buildLog = ({
  appName,
  msg,
  depth = 0,
}: {
  appName: string;
  msg: string;
  depth?: number;
}) => console.log('[ESZIP]', appName, '|', ...Array(depth).fill('∟ '), msg);

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
  const appName = `${app.slug}@${version}`;

  buildLog({ appName, msg: `Building for deployment` });

  const appFilesBaseUrl = `${baseUrl}/src`;
  const frameworkEntrypointUrl = `${baseUrl}/${FRAMEWORK_ENTRYPOINT}`;
  const appFileUrls = app.scripts.map(
    ({ filename }) => `${appFilesBaseUrl}/${filename}`,
  );
  const fileUrlsToBundle = [frameworkEntrypointUrl, ...appFileUrls];

  const bundle = await eszip.build(fileUrlsToBundle, async (specifier) => {
    buildLog({ appName, msg: `Resolving ${specifier}`, depth: 1 });

    /**
     * Handle user's App files
     */
    if (specifier.startsWith(appFilesBaseUrl)) {
      const filename = specifier.replace(`${appFilesBaseUrl}/`, '');
      const script = app.scripts.find((s) => s.filename === filename);

      buildLog({ appName, msg: `Adding ${filename}`, depth: 2 });

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

      buildLog({
        appName,
        msg: isHandlersPath
          ? `Generating new routes for at ${filename}`
          : `Adding ${FRAMEWORK_INTERNAL_PATH}/${filename}`,
        depth: 2,
      });

      let content = await readFrameworkFile(filename);

      // Inject Env vars
      ['RPC_HOST', 'HMAC_SIGNING_SECRET'].forEach((key) => {
        content = content.replaceAll(
          `Deno.env.get('${key}')`,
          `'${process.env[key]}'`,
        );
      });

      if (isHandlersPath) {
        content = generateHandlersForFramework({
          code: content,
          filenames: app.scripts.map((s) => s.filename),
        });
      }

      return {
        kind: 'module',
        specifier,
        headers: TYPESCRIPT_CONTENT_HEADERS,
        content,
      };
    }

    /**
     * Handle remote imports
     */
    return getModule(specifier, buildCache);
  });

  const elapsedMs = performance.now() - startMs;
  buildLog({ appName, msg: `Built in ${Math.round(elapsedMs)}ms` });

  return bundle;
}
