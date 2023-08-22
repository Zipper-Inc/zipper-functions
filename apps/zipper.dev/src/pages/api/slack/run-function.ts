import type { NextApiRequest, NextApiResponse } from 'next';
import {
  acknowledgeSlack,
  getAppInfo,
  buildFilenameSelect,
  buildSlackModalView,
  buildViewInputblock,
  openSlackModal,
  updateSlackModal,
} from './utils';

async function processZipperCommand(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.body.text;
  const triggerId = req.body.trigger_id;

  // get app info
  console.log('get appinfo');
  const appInfo = await getAppInfo(slug);

  console.log({ appInfo });
  // build slack view
  const view = {
    trigger_id: triggerId,
    view: buildSlackModalView({
      title: appInfo.data.app.name,
      callbackId: 'view-run-zipper-app',
      blocks: buildFilenameSelect(appInfo.data.runnableScripts),
      privateMetadata: `{ "slug": "${slug}" }`,
    }),
  };

  // open modal
  const openModalResponse = await openSlackModal(view);
  console.log('slack response');
  console.log(await openModalResponse.json());

  // acknowledge slash command
  return acknowledgeSlack(res);
}

async function processFilenameSelection(
  req: NextApiRequest,
  res: NextApiResponse,
  payload: any,
) {
  const privateMetadata = JSON.parse(payload.view.private_metadata);
  const filenameSelectAction = payload.actions.find((a: any) => {
    return a.action_id === 'filename_select_action';
  });

  const appInfo = await getAppInfo(
    privateMetadata.slug,
    filenameSelectAction.selected_option.value,
  );

  const blocks = [
    ...buildFilenameSelect(appInfo.data.runnableScripts),
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Inputs:*',
      },
    },
    ...buildViewInputblock(appInfo.data.inputs),
  ];

  console.log('blocks built');

  console.log(blocks);
  const newView = {
    view_id: payload.view.id,
    hash: payload.view.hash,
    view: buildSlackModalView({
      title: `${appInfo.data.app.name}`,
      callbackId: 'view-run-zipper-app',
      blocks,
      privateMetadata: `{ "slug": "${privateMetadata.slug}" }`,
    }),
  };

  const updateResponse = await updateSlackModal(newView);
  console.log('slack update response');
  console.log(await updateResponse.json());

  console.log('responding to slack');
  return res.status(200).send('ok');
}

function processRunScript(
  req: NextApiRequest,
  res: NextApiResponse,
  payload: any,
) {
  return res.status(200).json({
    response_action: 'update',
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: 'Updated view',
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: 'Function results go here',
          },
        },
      ],
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('run-function handler');
  console.log(req.url);
  console.log(req.body);
  // process the initial slack slash command
  if (req.body.command === '/zipper') {
    return processZipperCommand(req, res);
  }

  // check the payload and call the correct processor
  if (req.body.payload) {
    try {
      const payload = JSON.parse(req.body.payload);
      if (
        payload.type === 'block_actions' &&
        payload.actions &&
        payload.actions[0]?.type === 'static_select' &&
        payload.actions[0]?.block_id === 'filename_select'
      ) {
        return processFilenameSelection(req, res, payload);
      }

      if (payload.type === 'view_submission') {
        return processRunScript(req, res, payload);
      }
    } catch (e) {
      console.log('CAUGHT ERROR processessing zipper command');
      console.log(e);
    }
  }

  const response = 'ok';
  console.log('done');
  return res.status(200).send();
}
