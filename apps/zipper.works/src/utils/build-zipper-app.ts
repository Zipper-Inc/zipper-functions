import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import { generateHandlersForFramework } from '@zipper/utils';
import { getLogger } from './app-console';
import { prettyLog } from './pretty-log';
import { BuildCache, getModule } from './eszip-build-cache';
import { readFrameworkFile } from './read-file';

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

  const logger = getLogger({ appId: app.id, version });
  logger.info(
    ...prettyLog({
      topic: 'Deploy',
      subtopic: appName,
      badge: 'Pending',
      msg: `Starting build for deploy`,
    }),
  );

  const appFilesBaseUrl = `${baseUrl}/src`;
  const frameworkEntrypointUrl = `${baseUrl}/${FRAMEWORK_ENTRYPOINT}`;
  const appFileUrls = app.scripts.map(
    ({ filename }) => `${appFilesBaseUrl}/${filename}`,
  );
  const fileUrlsToBundle = [frameworkEntrypointUrl, ...appFileUrls];

  const bundle = await eszip.build(fileUrlsToBundle, async (specifier) => {
    // if (__DEBUG__) console.debug(specifier);

    /**
     * Handle user's App files
     */
    if (specifier.startsWith(appFilesBaseUrl)) {
      const filename = specifier.replace(`${appFilesBaseUrl}/`, '');
      const script = app.scripts.find((s) => s.filename === filename);

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
  logger.info(
    ...prettyLog({
      topic: 'Deploy',
      subtopic: appName,
      badge: 'Done',
      msg: `Completed in ${Math.round(elapsedMs)}ms`,
    }),
  );

  return bundle;
}
