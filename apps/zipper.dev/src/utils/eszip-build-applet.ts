import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import { generateIndexForFramework } from '@zipper/utils';
import { prisma } from '~/server/prisma';
import { storeVersionESZip } from '~/server/utils/r2.utils';
import { getLogger } from './app-console';
import { BuildCache } from './eszip-build-cache';
import {
  applyTsxHack,
  getModule,
  isZipperImportUrl,
  TYPESCRIPT_CONTENT_HEADERS,
} from './eszip-utils';
import { getAppHashAndVersion } from './hashing';
import { prettyLog, PRETTY_LOG_TOKENS } from './pretty-log';
import { readFrameworkFile } from './read-file';
import { rewriteImports } from './rewrite-imports';

/**
 * @todo
 * Bundle this up or put this source somewhere else
 * Totally possible that the directory structure cannot be guaranteed
 */
export const FRAMEWORK_ENTRYPOINT = 'run.ts';
export const APPLET_INDEX_PATH = 'applet/generated/index.gen.ts';

const buildCache = new BuildCache();

export async function build({
  baseUrl: _baseUrl,
  app,
  version,
}: {
  baseUrl?: string;
  app: Omit<
    App,
    'datastore' | 'categories' | 'deletedAt' | 'isTemplate' | 'dailyRunLimit'
  > & {
    scripts: Script[];
  };
  version: string;
}) {
  const startMs = performance.now();
  const appName = `${app.slug}@${version}`;
  const baseUrl = _baseUrl || `file://${app.slug}/v${version}`;
  const logger = getLogger({ appId: app.id, version });
  logger.info(
    ...prettyLog(
      {
        badge: 'Deploy',
        topic: appName,
        subtopic: 'Pending',
        msg: `Starting build for deploy`,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        badgeStyle: { background: PRETTY_LOG_TOKENS['fgText']! },
      },
    ),
  );
  const appFilesBaseUrl = `${baseUrl}/applet/src`;
  const frameworkEntrypointUrl = `${baseUrl}/${FRAMEWORK_ENTRYPOINT}`;

  const tsScripts = app.scripts.filter((s) => s.filename.endsWith('.ts'));

  const appFileUrls = tsScripts.map(
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
      const script = tsScripts.find((s) => s.filename === filename);

      return {
        ...applyTsxHack(specifier, rewriteImports(script?.code || '')),
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
      ['PUBLICLY_ACCESSIBLE_RPC_HOST', 'HMAC_SIGNING_SECRET'].forEach((key) => {
        content = content.replaceAll(
          `Deno.env.get('${key}')`,
          `'${process.env[key]}'`,
        );
      });

      if (isAppletIndex) {
        content = generateIndexForFramework({
          code: content,
          filenames: tsScripts.map((s) => s.filename),
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
     * Handle Zipper Remote Imports
     */
    if (isZipperImportUrl(specifier)) {
      const mod = await getModule(specifier);
      return {
        ...mod,
        ...applyTsxHack(specifier, rewriteImports(mod?.content)),
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
        badge: 'Deploy',
        topic: appName,
        subtopic: 'Done',
        msg: `Completed in ${Math.round(elapsedMs)}ms`,
      },
      { badgeStyle: { background: PRETTY_LOG_TOKENS['fgText']! } },
    ),
  );

  return bundle;
}

export async function buildAndStoreApplet({
  app,
  isPublished,
  userId,
}: {
  app: Omit<
    App,
    'datastore' | 'categories' | 'deletedAt' | 'isTemplate' | 'dailyRunLimit'
  > & {
    scripts: Script[];
  };
  isPublished?: boolean;
  userId?: string;
}) {
  const { hash, version } = getAppHashAndVersion({
    id: app.id,
    slug: app.slug,
    scripts: app.scripts,
  });

  const buildBuffer = async () => {
    return Buffer.from(
      await build({
        app,
        version,
      }),
    );
  };

  const savedVersion = await prisma.version.upsert({
    where: {
      hash,
    },
    create: {
      app: { connect: { id: app.id } },
      hash,
      buildFile: await buildBuffer(),
      isPublished: !!isPublished,
      userId,
    },
    update: {
      isPublished, // Only updates this if it's passed in - undefined will not update (which is good)
    },
  });

  if (savedVersion.buildFile) {
    storeVersionESZip({
      appId: app.id,
      version,
      eszip: savedVersion.buildFile,
    });
  }

  return { hash, eszip: savedVersion.buildFile };
}
