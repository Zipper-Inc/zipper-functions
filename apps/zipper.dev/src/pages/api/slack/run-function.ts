import type { NextApiRequest, NextApiResponse } from 'next';
import {
  acknowledgeSlack,
  getAppInfo,
  buildFilenameSelect,
  buildSlackModalView,
  buildViewInputBlock,
  openSlackModal,
  updateSlackModal,
  buildRunUrlBodyParams,
  runApp,
} from './utils';

async function processRerun(
  req: NextApiRequest,
  res: NextApiResponse,
  payload: any,
) {
  const { slug, filename } = JSON.parse(payload.view.private_metadata);

  const appInfo = await getAppInfo(slug, filename);

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
    ...buildViewInputBlock(appInfo.data.inputs),
  ];

  const newView = {
    view_id: payload.view.id,
    hash: payload.view.hash,
    view: buildSlackModalView({
      title: `${appInfo.data.app.name}`,
      callbackId: 'view-run-zipper-app',
      blocks,
      privateMetadata: `{ "slug": "${slug}", "filename": "${filename}" }`,
      showSubmit: false,
    }),
  };

  const updateResponse = await updateSlackModal(newView);
  console.log('slack update response');
  console.log(await updateResponse.json());

  return acknowledgeSlack(res);
}

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
      showSubmit: false,
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
    ...buildViewInputBlock(appInfo.data.inputs),
  ];

  const newView = {
    view_id: payload.view.id,
    hash: payload.view.hash,
    view: buildSlackModalView({
      title: `${appInfo.data.app.name}`,
      callbackId: 'view-run-zipper-app',
      blocks,
      privateMetadata: `{ "slug": "${privateMetadata.slug}", "filename": "${filenameSelectAction.selected_option.value}" }`,
      showSubmit: true,
    }),
  };

  const updateResponse = await updateSlackModal(newView);
  console.log('slack update response');
  console.log(await updateResponse.json());

  console.log('responding to slack');
  return res.status(200).send('ok');
}

async function processRunScript(
  req: NextApiRequest,
  res: NextApiResponse,
  payload: any,
) {
  const start = new Date();
  const { slug, filename } = JSON.parse(payload.view.private_metadata);
  const runUrl = `http://${slug}.localdev.me:3002/run/${filename}/api/json`;
  const body = buildRunUrlBodyParams(payload);

  const response = await runApp(runUrl, JSON.stringify(body));
  console.log(response);

  console.log(`Process Run for ${slug} ${filename}`);
  console.log(JSON.stringify(response.data));
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: JSON.stringify(response.data),
      },
    },
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: ' ',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Edit & Rerun',
        },
        value: 'edit_and_rerun',
        action_id: 'edit_and_rerun_button',
      },
    },
  ];

  const newView = {
    view_id: payload.view.id,
    hash: payload.view.hash,
    view: buildSlackModalView({
      title: `${slug}`,
      callbackId: 'view-zipper-app-results',
      blocks,
      privateMetadata: `{ "slug": "${slug}", "filename": "${filename}" }`,
      showSubmit: false,
    }),
  };

  const updateResponse = await updateSlackModal(newView);
  console.log('slack update response');
  // console.log(await updateResponse.json());

  console.log('responding to slack');
  const end = new Date();
  console.log((end.getTime() - start.getTime()) / 1000);
  return res.status(200).send('ok');
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
      if (payload.type === 'block_actions' && payload.actions) {
        console.log('PAYLOAD ACTIONS');
        console.log(payload.actions);
        if (
          payload.actions[0]?.type === 'static_select' &&
          payload.actions[0]?.block_id === 'filename_select'
        ) {
          return processFilenameSelection(req, res, payload);
        }
        if (payload.actions[0]?.action_id === 'edit_and_rerun_button') {
          return processRerun(req, res, payload);
        }
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
