import type { NextApiRequest, NextApiResponse } from 'next';
import { trpcRouter } from '~/server/routers/_app';
import { createContext } from '~/server/context';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { query } = req;

  const appId = Array.isArray(query.appId) ? query.appId[0] : query.appId;
  const version = Array.isArray(query.version)
    ? query.version[0]
    : query.version;

  if (!appId)
    throw new Error("No app id so I don't know which events you want");

  if (!version) throw new Error("No version so I can't get your app events");

  const caller = trpcRouter.createCaller(createContext({ req, res }));
  const appEvents = await caller.query('appEvent.all', {
    deploymentId: `${appId}@${query.version}`,
  });

  res.send(appEvents);
}
