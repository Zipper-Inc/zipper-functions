import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { getAppVersionFromHash } from '~/utils/hashing';
import { getVersionCode } from '~/server/utils/r2.utils';
import { Script } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { query } = req;

  const { slug, version, filename } = query as {
    slug: string;
    version: string;
    filename: string;
  };

  const app = await prisma.app.findFirst({
    where: { slug, isPrivate: false },
    include: { scripts: true },
  });

  if (!app) throw new Error('No app found. Maybe your gave me a bad app id?');

  const loweredQueryFilename = filename.toLowerCase();
  console.log(loweredQueryFilename);

  let scripts: Omit<Script, 'id' | 'connectorId' | 'order'>[] | undefined;

  if (
    version === 'latest' ||
    version === getAppVersionFromHash(app.playgroundVersionHash)
  ) {
    scripts = app.scripts;
  } else {
    scripts = await getVersionCode({ appId: app.id, version });
  }

  if (scripts) {
    const script = scripts.find((script) => {
      const loweredScriptFilename = script.filename.toLowerCase();
      return (
        loweredScriptFilename === loweredQueryFilename ||
        loweredScriptFilename === `${loweredQueryFilename}.ts`
      );
    });

    if (!script)
      throw new Error('No script found. Maybe you gave me the wrong filename?');

    res.setHeader('Content-Type', 'text/typescript');

    res.send(script.code);
  } else {
    res.status(404).send('Not found');
  }
}
