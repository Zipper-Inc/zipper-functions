import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import { generateIndexForFramework } from '@zipper/utils';
import { getLogger } from './app-console';
import { prettyLog, PRETTY_LOG_TOKENS } from './pretty-log';
import { BuildCache, getModule } from './eszip-build-cache';
import { readFrameworkFile } from './read-file';
import { getAppHashAndVersion } from './hashing';
import { prisma } from '~/server/prisma';
import s3Client from '~/server/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

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
  app: Omit<App, 'datastore' | 'categories' | 'deletedAt'> & {
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
        badgeStyle: { background: PRETTY_LOG_TOKENS['fgText']! },
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
  app: Omit<App, 'datastore' | 'categories' | 'deletedAt'> & {
    scripts: Script[];
  };
  isPublished?: boolean;
  userId?: string;
}) {
  const { hash, version } = getAppHashAndVersion({
    id: app.id,
    name: app.name,
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
      hash: hash,
      buildFile: await buildBuffer(),
      isPublished: !!isPublished,
      userId,
    },
    update: {
      isPublished, // Only updates this if it's passed in - undefined will not update (which is good)
    },
  });

  if (savedVersion.buildFile) {
    s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUILD_FILE_BUCKET_NAME,
        Key: `${savedVersion.appId}/${version}`,
        Body: savedVersion.buildFile,
      }),
    );
  }

  return { hash, eszip: savedVersion.buildFile };
}
