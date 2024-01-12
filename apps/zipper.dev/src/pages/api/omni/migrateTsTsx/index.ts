import {
  successResponse,
  methodNotAllowed,
  createOmniApiHandler,
} from '~/server/utils/omni.utils';
import { HttpMethod } from '@zipper/types';
import { withParser } from 'jscodeshift';
import { prisma } from '~/server/prisma';
import { Script } from '@prisma/client';
import { buildAndStoreApplet } from '~/utils/eszip-build-applet';

const renameTsImportsToTsx = async (code: string) => {
  const j = withParser('tsx');
  const $j = j(code);

  return $j
    .find(j.ImportDeclaration)
    .filter(
      (path) =>
        typeof path.node.source.value === 'string' &&
        path.node.source.value.startsWith('./') &&
        path.node.source.value.endsWith('.ts') &&
        path.node.source.value !== './main.ts',
    )
    .forEach((path) => {
      if (typeof path.node.source.value === 'string') {
        path.node.source.value = path.node.source.value.replace(
          /\.ts$/,
          '.tsx',
        );
      }
    })
    .toSource();
};

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    case HttpMethod.POST: {
      const { limit } = req.body as { limit: number };

      const errors = [];
      let totalUpdatedInLimit = 0;

      const totalApplets = await prisma.app.count();
      const alreadyUpdated = await prisma.appSetting.count({
        where: { settingName: 'isMigratedToTsx', settingValue: 'true' },
      });

      const appletsIdsInsideLimit = await prisma.app.findMany({
        take: Number(limit),
        where: {
          settings: {
            none: {
              settingName: 'isMigratedToTsx',
              settingValue: 'true',
            },
          },
        },
        include: {
          settings: true,
        },
      });

      try {
        // for each applet in the limit
        //   for each script in applet
        //     rename each script filename
        //     update the code with morph
        //     create new playgroundHash based on your new script content and filenames
        for await (const { id: appletId } of appletsIdsInsideLimit) {
          const updatedScripts: Script[] = [];

          const app = await prisma.app.findFirstOrThrow({
            where: { id: appletId },
            include: { scripts: true },
          });

          await prisma.appSetting.upsert({
            create: {
              app: { connect: { id: app.id } },
              settingName: 'isMigratedToTsx',
              settingValue: 'false',
            },
            update: {
              settingValue: 'false',
            },
            where: {
              settingName_appId: {
                appId: app.id,
                settingName: 'isMigratedToTsx',
              },
            },
          });

          const nonMainTsScripts = app.scripts.filter(
            (script) =>
              script.filename.endsWith('.ts') && script.filename !== 'main.ts',
          );

          const main = app.scripts.find(
            (script) => script.filename === 'main.ts',
          );

          if (!main) {
            errors.push({ message: 'main.ts not found', appletName: app.name });
            console.log(
              'Applet',
              app.name || 'unknown',
              app.id,
              'doesnt have main.ts',
            );
          }

          console.log('Updating applet', app.name || 'unknown', app.id);

          for await (const script of nonMainTsScripts) {
            console.log('- script:', script.filename);
            // rename script that arent main
            const newFilename = script.filename.replace(/\.ts$/, '.tsx');

            // update code that arent main
            await renameTsImportsToTsx(script.code)
              .then((newCode) =>
                updatedScripts.push({
                  ...script,
                  code: newCode,
                  filename: newFilename,
                }),
              )
              .catch((e: Error) => {
                errors.push({
                  appletName: app.name || 'unknown',
                  appletId: app.id,
                  code: script.code,
                  message: e.message,
                });
              });
          }

          const hasUpdated = updatedScripts.length > 0;

          if (hasUpdated && main) {
            console.log('- script:', 'main.ts');
            // update main code imports
            await renameTsImportsToTsx(main.code)
              .then((newMainCode) =>
                updatedScripts.push({ ...main, code: newMainCode }),
              )
              .catch((e: Error) => {
                errors.push({
                  appletName: app.name || 'unknown',
                  appletId: app.id,
                  code: main.code,
                  message: e.message,
                });
              });
          }

          // Rename filename and perform code updates
          await prisma
            .$transaction([
              ...updatedScripts.map((updatedScript) =>
                prisma.script.update({
                  where: { id: updatedScript.id },
                  data: {
                    filename: updatedScript.filename,
                    code: updatedScript.code,
                  },
                }),
              ),
              prisma.appSetting.upsert({
                create: {
                  app: { connect: { id: app.id } },
                  settingName: 'isMigratedToTsx',
                  settingValue: 'true',
                },
                update: {
                  settingValue: 'true',
                },
                where: {
                  settingName_appId: {
                    appId: app.id,
                    settingName: 'isMigratedToTsx',
                  },
                },
              }),
            ])
            .then(() => {
              totalUpdatedInLimit++;
              console.log('Updated applet', app.name || 'unknown', app.id);
            })
            .catch((e: Error) => {
              console.log(
                'Error updating applet',
                app.name || 'unknown',
                app.id,
              );
              errors.push({
                appletName: app.name || 'unknown',
                appletId: app.id,
                message: e.message,
              });
            });

          if (hasUpdated) {
            buildAndStoreApplet({
              app: { ...app, scripts: updatedScripts },
              userId: 'MIGRATION_SCRIPT',
            })
              // get new hash
              .then(async ({ hash }) => {
                if (hash !== app.playgroundVersionHash) {
                  // update db version hash
                  await prisma.app.update({
                    where: { id: appletId },
                    data: { playgroundVersionHash: hash },
                  });
                }
              })
              .catch((e: Error) => {
                errors.push({
                  appletName: app.name || 'unknown',
                  appletId: app.id,
                  message: e.message,
                });
              });
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          errors.push({
            message: e.message,
            name: e.name,
            stack: e.stack,
          });
        }
      } finally {
        if (errors.length > 0) {
          // well, thats a error response actually
          // biome-ignore lint/correctness/noUnsafeFinally: already migrated
          return successResponse({
            res,
            status: 500,
            body: {
              data: {
                errors,
                totalApplets,
                totalUpdatedInLimit,
                totalUpdated: alreadyUpdated + totalUpdatedInLimit,
              },
              ok: true,
            },
          });
        }

        // biome-ignore lint/correctness/noUnsafeFinally: already migrated
        return successResponse({
          res,
          body: {
            data: {
              ok: true,
              totalApplets,
              totalUpdated: alreadyUpdated + totalUpdatedInLimit,
            },
            ok: true,
          },
        });
      }
    }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
