import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import { baseColors, brandColors } from '@zipper/ui';
import { generateHandlersForFramework } from '@zipper/utils';
import { getLogger } from './app-console';
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

const buildLog = ({
  appName,
  msg,
  topic,
  logger,
}: {
  appName: string;
  msg: string;
  topic?: string;
  logger: any;
}) => {
  const data = [
    '%c DEPLOY ' + `%c  ${appName}  ` + (topic ? `%c ${topic} ` : ''),
    `fontWeight: 800; color: white; background: ${brandColors.brandPurple};`,
    `fontWeight: 500; color: ${baseColors.gray[600]}; background: ${baseColors.gray[50]};`,
    topic
      ? `fontWeight: 200; font-size: smaller; height: 100%; color: ${brandColors.brandDarkPurple}; text-transform: uppercase;`
      : '',
    msg,
  ].filter((v) => !!v);
  console.log(...data);
  logger.log(...data);
};

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
  buildLog({ logger, appName, msg: `Building for deployment` });

  const appFilesBaseUrl = `${baseUrl}/src`;
  const frameworkEntrypointUrl = `${baseUrl}/${FRAMEWORK_ENTRYPOINT}`;
  const appFileUrls = app.scripts.map(
    ({ filename }) => `${appFilesBaseUrl}/${filename}`,
  );
  const fileUrlsToBundle = [frameworkEntrypointUrl, ...appFileUrls];

  const bundle = await eszip.build(fileUrlsToBundle, async (specifier) => {
    /**
     * Handle user's App files
     */
    if (specifier.startsWith(appFilesBaseUrl)) {
      const filename = specifier.replace(`${appFilesBaseUrl}/`, '');
      const script = app.scripts.find((s) => s.filename === filename);

      buildLog({
        logger,
        appName,
        msg: `Resolving ${specifier}`,
        topic: 'Applet',
      });

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
        logger,
        appName,
        msg: `Resolving ${specifier}`,
        topic: isHandlersPath ? 'Routes' : 'Framework',
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
    buildLog({
      logger,
      appName,
      msg: `Resolving ${specifier}`,
      topic: 'Remote',
    });
    return getModule(specifier, buildCache);
  });

  const elapsedMs = performance.now() - startMs;
  buildLog({ logger, appName, msg: `Built in ${Math.round(elapsedMs)}ms` });

  return bundle;
}
