import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import { generateIndexForFramework } from '@zipper/utils';
import { getLogger } from './app-console';
import { prettyLog } from './pretty-log';
import { BuildCache, getModule } from './eszip-build-cache';
import { readFrameworkFile } from './read-file';
import { getAppHash, getAppVersionFromHash } from './hashing';

/**
 * @todo
 * Bundle this up or put this source somewhere else
 * Totally possible that the directory structure cannot be guaranteed
 */
export const FRAMEWORK_ENTRYPOINT = 'run.ts';
export const APPLET_INDEX_PATH = 'applet/generated/index.gen.ts';
export const TYPESCRIPT_CONTENT_HEADERS = {
  'content-type': 'text/typescript',
};

const buildCache = new BuildCache();

export async function build({
  baseUrl: _baseUrl,
  app,
  version,
}: {
  baseUrl?: string;
  app: Omit<App, 'datastore' | 'categories'> & { scripts: Script[] };
  version: string;
}) {
  const startMs = performance.now();
  const appName = `${app.slug}@${version}`;
  const baseUrl = _baseUrl || `file://${app.slug}/v${version}`;

  const logger = getLogger({ appId: app.id, version });
  logger.info(
    ...prettyLog(
      {
        topic: 'Deploy',
        subtopic: appName,
        badge: 'Pending',
        msg: `Starting build for deploy`,
      },
      {
        topicStyle: { background: 'black' },
      },
    ),
  );

  const appFilesBaseUrl = `${baseUrl}/applet/src`;
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
        // Add TSX to all files so they support JSX
        specifier: specifier.replace(/\.(ts|tsx)$|$/, '.tsx'),
        headers: TYPESCRIPT_CONTENT_HEADERS,
        content:
          // Add the JSX pragma to all files automatically
          script?.code?.replace(
            /^/,
            '/** @jsx Zipper.JSX.createElement @jsxFrag Zipper.JSX.Fragment */',
          ) || '/* 🤷🏽‍♂️ missing code */',
        kind: 'module',
        version,
      };
    }

    /**
     * Handle Zipper Framework Files
     */
    if (specifier.startsWith(baseUrl)) {
      const filename = specifier.replace(`${baseUrl}/`, '');
      const isAppletIndex = filename === APPLET_INDEX_PATH;

      let content = await readFrameworkFile(filename);

      // Inject Env vars
      ['RPC_HOST', 'HMAC_SIGNING_SECRET'].forEach((key) => {
        content = content.replaceAll(
          `Deno.env.get('${key}')`,
          `'${process.env[key]}'`,
        );
      });

      if (isAppletIndex) {
        content = generateIndexForFramework({
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
    ...prettyLog(
      {
        topic: 'Deploy',
        subtopic: appName,
        badge: 'Done',
        msg: `Completed in ${Math.round(elapsedMs)}ms`,
      },
      { topicStyle: { background: 'black' } },
    ),
  );

  return bundle;
}
