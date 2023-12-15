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
        path.node.source.value.endsWith('.ts'),
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
    case HttpMethod.POST:
      const errors = [];

      const appletsIds = await prisma.app.findMany({
        select: {
          id: true,
        },
      });

      try {
        // for each applet
        //   for each script in applet
        //     rename each script filename
        //     update the code with morph
        //     create new playgroundHash based on your new script content and filenames
        for (const { id: appletId } of appletsIds) {
          const updatedScripts: Script[] = [];

          const app = await prisma.app.findUniqueOrThrow({
            where: { id: appletId },
            include: { scripts: true },
          });

          // TODO: this block should be a prisma transaction?
          const nonMainTsScripts = app.scripts.filter(
            (script) =>
              script.filename.endsWith('.ts') && script.filename !== 'main.ts',
          );

          const main = app.scripts.find(
            (script) => script.filename === 'main.ts',
          )!;

          if (!main) {
            errors.push({ message: 'main.ts not found', appletName: app.name });
          }

          for (const script of nonMainTsScripts) {
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

          if (hasUpdated) {
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
          await Promise.all(
            updatedScripts.map((updatedScript) =>
              prisma.script.update({
                where: { id: updatedScript.id },
                data: {
                  filename: updatedScript.filename,
                  code: updatedScript.code,
                },
              }),
            ),
          );

          if (hasUpdated) {
            const zipperCodemodUser = await prisma.user.findFirst({
              where: { slug: 'zipper-codemods' },
              select: { id: true },
            });

            // get new hash
            const { hash } = await buildAndStoreApplet({
              app: { ...app, scripts: updatedScripts },
              userId: zipperCodemodUser?.id,
            });

            if (hash !== app.playgroundVersionHash) {
              // update db version hash
              await prisma.app.update({
                where: { id: appletId },
                data: { playgroundVersionHash: hash },
              });
            }
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
          return successResponse({
            res,
            status: 500,
            body: {
              data: { errors },
              ok: true,
            },
          });
        }

        return successResponse({
          res,
          body: { data: { ok: true }, ok: true },
        });
      }

    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
