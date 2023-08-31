import type { NextApiRequest, NextApiResponse } from 'next';
import {
  acknowledgeSlack,
  getAppInfo,
  buildFilenameSelect,
  buildSlackModalView,
  openSlackModal,
  buildPrivateMetadata,
} from './utils';

const { __DEBUG__ } = process.env;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slug = req.body.text;
  const triggerId = req.body.trigger_id;
  const slackTeamId = req.body.team_id;
  const slackAppId = req.body.api_app_id;

  const appInfo = await getAppInfo(slug);

  if (!appInfo.ok) return res.status(200).send(`Error: ${appInfo.error}`);

  const blocks = buildFilenameSelect(appInfo.data.runnableScripts);
  const privateMetadata = buildPrivateMetadata({ slug });
  const view = buildSlackModalView({
    title: appInfo.data.app.name,
    callbackId: 'view-run-zipper-app',
    blocks,
    privateMetadata,
    showSubmit: false,
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
