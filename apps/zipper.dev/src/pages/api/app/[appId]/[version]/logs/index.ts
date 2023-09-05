import { NextApiRequest, NextApiResponse } from 'next';
import { LogMessage } from '@zipper/types';
import { sendLog } from '~/utils/app-console';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { appId, version, runId } = req.query;
  if (!appId || !version) return res.status(500);

  switch (req.method) {
    case 'POST': {
      const message = JSON.parse(req.body) as LogMessage;
      console.log(message);
      try {
        sendLog({
          appId: appId.toString(),
          version: version.toString(),
          runId: runId?.toString(),
          log: message,
        });
      } catch (e) {
        console.error(e);
        return res.status(500);
      }
    }
  }
}
