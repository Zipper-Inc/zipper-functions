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
  //     create new playgroundHash based on your new script content and filenames
  for (const { id: appletId } of appletsIds) {
    const updatedScripts: Script[] = [];

    const app = await prisma.app.findUniqueOrThrow({
      where: { id: appletId },
      include: { scripts: true },
    });

    // TODO: this block should be a prisma transaction?
    for (const script of app.scripts) {
      // rename script
      const newFilename = script.filename.replace(/\.ts$/, '.tsx');
      await prisma.script.update({
        where: { id: script.id },
        data: { filename: newFilename },
      });

      // update code
      const newCode = await renameTsImportsToTsx(script.code);
      updatedScripts.push({ ...script, code: newCode });
    }

    // --- VERSION HASHING ---
    // get new hash
    const { hash } = await buildAndStoreApplet({
      app: { ...app, scripts: updatedScripts },
    });
    // update in the db
    await prisma.app.update({
      where: { id: appletId },
      data: { playgroundVersionHash: hash },
    });
  }
})();
