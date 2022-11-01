import type { NextApiRequest, NextApiResponse } from 'next';
import { trpcRouter } from '~/server/routers/_app';
import { createContext } from '~/server/context';

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

  const caller = trpcRouter.createCaller(createContext({ req, res }));
  const app = await caller.query('app.byId', {
    id: appId,
  });

  if (!app) throw new Error('No app found. Maybe your gave me a bad app id?');

  const script = app.scripts.find((script) => {
    const loweredScriptFilename = script.filename.toLowerCase();
    const loweredQueryFilename = filename.toLowerCase();

    return (
      loweredScriptFilename === loweredQueryFilename ||
      loweredScriptFilename === `${loweredQueryFilename}.ts`
    );
  });

  if (!script)
    throw new Error('No script found. Maybe your gave me the wrong filename?');

  res.setHeader('Content-Type', 'text/typescript');
  res.send(script.code);
}
