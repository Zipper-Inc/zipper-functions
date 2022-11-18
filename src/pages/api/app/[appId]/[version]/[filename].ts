import type { NextApiRequest, NextApiResponse } from 'next';
import { wrapMainFunction } from '~/pages/api/deno/v0/[rpc]';
import { prisma } from '~/server/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { query } = req;

  const appId = Array.isArray(query.appId) ? query.appId[0] : query.appId;
  const filename = Array.isArray(query.filename)
    ? query.filename[0]
    : query.filename;

  if (!appId)
    throw new Error(
      "No app id so I can't look up the app and get you source code",
    );

  if (!filename)
    throw new Error("No filename so I can't look up the source code for you");

  const app = await prisma.app.findFirst({
    where: { id: appId },
    include: { scripts: true },
  });

  if (!app) throw new Error('No app found. Maybe your gave me a bad app id?');

  const loweredQueryFilename = filename.toLowerCase();

  const script = app.scripts.find((script) => {
    const loweredScriptFilename = script.filename.toLowerCase();
    return (
      loweredScriptFilename === loweredQueryFilename ||
      loweredScriptFilename === `${loweredQueryFilename}.ts`
    );
  });

  if (!script)
    throw new Error('No script found. Maybe your gave me the wrong filename?');

  res.setHeader('Content-Type', 'text/typescript');

  let code = script.code;

  if (loweredQueryFilename === 'main.ts' || loweredQueryFilename === 'main') {
    code = wrapMainFunction({
      code: script.code,
      name: app.name,
      appId: app.id,
      version: script.updatedAt?.toString() || script.createdAt.toString(),
    });
  }

  res.send(code);
}
