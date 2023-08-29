import type { NextApiRequest, NextApiResponse } from 'next';
import {
  acknowledgeSlack,
  buildRunResultView,
  updateSlackModal,
  buildRunUrlBodyParams,
  buildInputModal,
  runApp,
} from './utils';

const { __DEBUG__ } = process.env;

async function processRerun(res: NextApiResponse, payload: any) {
  const { slug, filename } = JSON.parse(payload.view.private_metadata);

  const newView = await buildInputModal(
    slug,
    filename,
    payload.view.id,
    payload.view.hash,
  );

  const updateResponse = await updateSlackModal(newView);
  if (__DEBUG__) {
    console.log('slack update response for rerun');
    console.log(await updateResponse.json());
  }

  return acknowledgeSlack(res);
}

async function processFilenameSelection(res: NextApiResponse, payload: any) {
  const { slug } = JSON.parse(payload.view.private_metadata);
  const filenameSelectAction = payload.actions.find((a: any) => {
    return a.action_id === 'filename_select_action';
  });

  const newView = await buildInputModal(
    slug,
    filenameSelectAction.selected_option.value,
    payload.view.id,
    payload.view.hash,
  );

  const updateResponse = await updateSlackModal(newView);
  if (__DEBUG__) {
    console.log('slack update response for filename selection');
    console.log(await updateResponse.json());
  }

  return acknowledgeSlack(res);
}

async function submissionHandler(res: NextApiResponse, payload: any) {
  const { slug, filename } = JSON.parse(payload.view.private_metadata);
  const inputs = buildRunUrlBodyParams(payload);
  const response = await runApp(slug, filename, inputs);
  const view = buildRunResultView(slug, filename, response);

  return res.status(200).json({
    response_action: 'update',
    view,
  });
}

function blockActionHandler(res: NextApiResponse, payload: any) {
  if (
    payload.actions[0]?.type === 'static_select' &&
    payload.actions[0]?.block_id === 'filename_select'
  ) {
    return processFilenameSelection(res, payload);
  }

  if (payload.actions[0]?.action_id === 'edit_and_rerun_button') {
    return processRerun(res, payload);
  }

  //ignore other interaction types
  return acknowledgeSlack(res);
}

type InteractionTypeHandler = (res: NextApiResponse, payload: any) => void;

const InteractionTypeFuncMap: { [key: string]: InteractionTypeHandler } = {
  block_actions: blockActionHandler,
  view_submission: submissionHandler,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (__DEBUG__) {
    console.log('interaction handler');
    console.log({ url: req.url, body: req.body });
  }

  const payload = JSON.parse(req.body.payload);
  if (!payload || !InteractionTypeFuncMap[payload.type]) return res.status(400);

  return InteractionTypeFuncMap[payload.type]?.(res, payload);
}
