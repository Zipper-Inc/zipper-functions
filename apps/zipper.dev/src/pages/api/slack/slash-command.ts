import type { NextApiRequest, NextApiResponse } from 'next';
import {
  acknowledgeSlack,
  fetchBootInfo,
  buildSlackModalView,
  openSlackModal,
  buildPrivateMetadata,
  buildInputModal,
} from './utils';

const { __DEBUG__ } = process.env;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slug = req.body.text;
  if (!slug)
    return res.send(
      'Missing applet slug - try something like `/zipper json-parser`',
    );
  const triggerId = req.body.trigger_id;
  const slackTeamId = req.body.team_id;
  const slackAppId = req.body.api_app_id;

  const appInfo = await fetchBootInfo(slug);

  if (!appInfo.ok) return res.status(200).send(`Error: ${appInfo.error}`);

  // const blocks = buildFilenameSelect(appInfo.data.runnableScripts);
  const blocks = await buildInputModal(slug, 'main.ts');
  const privateMetadata = buildPrivateMetadata({ slug, filename: 'main.ts' });
  const view = buildSlackModalView({
    title: appInfo.data.app.name,
    callbackId: 'view-run-zipper-app',
    blocks,
    privateMetadata,
    showSubmit: true,
  });
  const modal = {
    trigger_id: triggerId,
    view,
  };

  const openModalResponse = await openSlackModal(
    modal,
    slackAppId,
    slackTeamId,
  );
  if (__DEBUG__) {
    console.log('slack open modal response');
    console.log(await openModalResponse.json());
  }

  return acknowledgeSlack(res);
}
