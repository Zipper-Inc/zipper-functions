import { Script } from '@prisma/client';
import { withParser } from 'jscodeshift';
import { prisma } from '~/server/prisma';
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

(async () => {
  const appletsIds = await prisma.app.findMany({
    select: {
      id: true,
    },
  });
  // for each applet
  //   for each script in applet
  //     rename each script filename
  //     update the code with morph
  //     create new version and update the app playgroundHash based on your new script content and filenames
  for (const { id: appletId } of appletsIds) {
    const updatedScripts: Script[] = [];

    const app = await prisma.app.findUniqueOrThrow({
      where: { id: appletId },
      include: { scripts: true },
    });

    const runnableScripts = app.scripts.filter(
      (script) =>
        script.filename.endsWith('.ts') && script.filename !== 'main.ts',
    );

    const main = app.scripts.find((script) => script.filename === 'main.ts');

    if (!main) {
      throw new Error(`main.ts not found appletName: ${app.name}`);
    }

    for (const script of runnableScripts) {
      // rename script that arent main
      const newFilename = script.filename.replace(/\.ts$/, '.tsx');

      // update code that arent main
      await renameTsImportsToTsx(script.code).then((newCode) =>
        updatedScripts.push({
          ...script,
          code: newCode,
          filename: newFilename,
        }),
      );
    }

    const hasUpdated = updatedScripts.length > 0;

    if (hasUpdated) {
      // update main code imports
      await renameTsImportsToTsx(main.code).then((newMainCode) =>
        updatedScripts.push({ ...main, code: newMainCode }),
      );
    }

    // TODO: prisma.$transaction

    // Rename and code updates
    await Promise.all(
      updatedScripts.map((script) =>
        prisma.script.update({
          where: { id: script.id },
          data: { code: script.code },
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
        // update the playground hash to use the new version
        await prisma.app.update({
          where: { id: appletId },
          data: { playgroundVersionHash: hash },
        });
      }
    }
  }
})();
