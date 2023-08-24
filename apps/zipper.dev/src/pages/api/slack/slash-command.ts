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

type SlashCommandHandler = (req: NextApiRequest, res: NextApiResponse) => void;

async function zipperHandler(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.body.text;
  const triggerId = req.body.trigger_id;

  const appInfo = await getAppInfo(slug);
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

  const openModalResponse = await openSlackModal(modal);
  if (__DEBUG__) {
    console.log('slack open modal response');
    console.log(await openModalResponse.json());
  }

  return acknowledgeSlack(res);
}

const commandHandlerMap: { [key: string]: SlashCommandHandler } = {
  ['/zipper']: zipperHandler,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (__DEBUG__) {
    console.log('Slack Slash Command handler');
    console.log({ url: req.url, body: req.body });
  }

  if (commandHandlerMap[req.body.command])
    return commandHandlerMap[req.body.command]?.(req, res);

  console.error('unknown command');
  return res.status(200).send('unknown command');
}
