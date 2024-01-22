import * as eszip from '@deno/eszip';
import { App, Script } from '@prisma/client';
import { generateIndexForFramework } from '@zipper/utils';
import { prisma } from '~/server/prisma';
import { storeVersionESZip } from '~/server/utils/r2.utils';
import { getLogger } from './app-console';
import { getBootInfoFromPrisma } from './boot-info-utils';
import { BuildCache } from './eszip-build-cache';
import {
  applyTsxHack,
  getRemoteModule,
  isZipperImportUrl,
  TYPESCRIPT_CONTENT_HEADERS,
} from './eszip-utils';
import { getAppHashAndVersion } from './hashing';
import {
  createProjectFromCode,
  hasHandler,
  isClientModule,
  parseActions,
} from './parse-code';
import { prettyLog, PRETTY_LOG_TOKENS } from './pretty-log';
import { readFrameworkFile } from './read-file';
import { rewriteImports, Target } from './rewrite-imports';

const FILENAME_FORBIDDEN_CHARS_REGEX = /[^a-zA-Z0-9_.\-@$)]/;

/**
 * @todo
 * Bundle this up or put this source somewhere else
 * Totally possible that the directory structure cannot be guaranteed
 */
export const FRAMEWORK_ENTRYPOINT = 'run.ts';
export const APPLET_INDEX_PATH = 'applet/generated/index.gen.ts';
export const BOOT_INFO_PATH = 'applet/generated/boot-info.gen.ts';

const buildCache = new BuildCache();

async function getFrameworkFileContent(
  slug: string,
  filename: string,
  scripts: Script[],
) {
  switch (filename) {
    case APPLET_INDEX_PATH:
      return generateIndexForFramework({
        code: await readFrameworkFile(filename),
        filenames: scripts.map((s) => s.filename),
      });
    case BOOT_INFO_PATH:
      const bootInfo = await getBootInfoFromPrisma({ slugFromUrl: slug });
      if (bootInfo instanceof Error) throw bootInfo;
      return `export default ${JSON.stringify(bootInfo)};`;
    default:
      return readFrameworkFile(filename);
  }
}

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
  const target = Target.Deno;
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

  const tsScripts = app.scripts.filter(
    (s) => s.filename.endsWith('.ts') || s.filename.endsWith('.tsx'),
  );

  const appFileUrls = tsScripts.map(
    ({ filename }) => `${appFilesBaseUrl}/${filename}`,
  );

  const fileUrlsToBundle = [frameworkEntrypointUrl, ...appFileUrls];

  const bundle = await eszip.build(fileUrlsToBundle, async (specifier) => {
    // if (__DEBUG__) console.debug(specifier);
    try {
      /**
       * Handle user's App files
       */
      if (specifier.startsWith(appFilesBaseUrl)) {
        const filename = specifier
          .replace(`${appFilesBaseUrl}/`, '')
          .replace(FILENAME_FORBIDDEN_CHARS_REGEX, '');

        const script = tsScripts.find((s) => s.filename === filename);

        const { src, handlerFile, project } = createProjectFromCode(
          script?.code || '',
        );

        let rewrittenCode = rewriteImports(src);

        if (isClientModule({ handlerFile, project })) {
          rewrittenCode = `/// <reference lib="dom" />\n${rewrittenCode}`;
        }

        if (hasHandler({ code: src.getFullText() })) {
          const handlerMeta = `handler.__handlerMeta = ${JSON.stringify({
            name: filename.replace(/\.tsx?$/, ''),
            path: `/${filename}`,
          })}`;
          const inputTypes = `export type __handlerInputs = Parameters<typeof handler>[0]`;
          rewrittenCode = `${rewrittenCode}\n${handlerMeta};${inputTypes};`;
        }

        const actions = parseActions({
          handlerFile,
          project,
          throwErrors: false,
        });
        const actionNames = Object.keys(actions || {});

        if (actionNames?.length) {
          const actionsMeta = actionNames.map((name) => {
            const meta = JSON.stringify({
              name,
              path: `/${filename}/$${name}`,
            });

            return `actions['${name}'].__handlerMeta = ${meta}`;
          });

          const actionInputTypes = actionNames.map(
            (name) =>
              `export type __$${name}Inputs = Parameters<typeof actions['${name}']>[0]`,
          );

          rewrittenCode = `${rewrittenCode}\n${actionsMeta
            .concat(...actionInputTypes)
            .join(';')};`;
        }

        return {
          ...applyTsxHack({
            specifier,
            code: rewrittenCode,
            isMain: specifier.endsWith('main.ts'),
          }),
          version,
        };
      }

      /**
       * Handle Zipper Framework Files
       */
      if (specifier.startsWith(baseUrl)) {
        const filename = specifier.replace(`${baseUrl}/`, '');

        let content = await getFrameworkFileContent(
          app.slug,
          filename,
          tsScripts,
        );

        // Inject Env vars
        ['PUBLICLY_ACCESSIBLE_RPC_HOST', 'HMAC_SIGNING_SECRET'].forEach(
          (key) => {
            content = content.replaceAll(
              `Deno.env.get('${key}')`,
              `'${process.env[key]}'`,
            );
          },
        );

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
        const mod = await getRemoteModule({ specifier, target });
        return {
          ...mod,
          ...applyTsxHack({
            specifier,
            code: rewriteImports(mod?.content),
            isMain: specifier.endsWith('main.ts'),
          }),
        };
      }

      /**
       * Handle remote imports
       */
      return getRemoteModule({ specifier, buildCache, target });
    } catch (e) {
      if (e instanceof Error) {
        // 🚨 Security Fix
        // Catch file not found errors and do not leak the file system
        if (e.message.includes('ENOENT')) e.message = `File not found`;
        e.message = `Error building ${specifier}: ${e.message}`;
      }
      throw e;
    }
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
    secretsHash: app.secretsHash,
  });

  const buildBuffer = async () => {
    return Buffer.from(
      await build({
        app,
        version,
      }),
    );
  };

  const buildFile = await buildBuffer();

  const savedVersion = await prisma.version.upsert({
    where: {
      hash,
    },
    create: {
      app: { connect: { id: app.id } },
      hash,
      buildFile,
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
