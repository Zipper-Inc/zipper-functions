import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import {
  acknowledgeSlack,
  buildRunResultView,
  updateSlackModal,
  buildRunUrlBodyParams,
  buildInputModal,
  buildSlackModalView,
} from './utils';

const { __DEBUG__ } = process.env;

async function processRerun(res: NextApiResponse, payload: any) {
  const { slug, filename } = JSON.parse(payload.view.private_metadata);
  const {
    api_app_id: appId,
    team: { id: teamId },
    view: { id: viewId, hash: viewHash },
  } = payload;

  const blocks = await buildInputModal(slug, filename);

  const newView = {
    view_id: viewId,
    hash: viewHash,
    view: buildSlackModalView({
      title: payload.view.title.text,
      callbackId: 'view-run-zipper-app',
      blocks,
      privateMetadata: payload.view.private_metadata,
      showSubmit: true,
    }),
  };

  const updateResponse = await updateSlackModal(newView, appId, teamId);

  if (__DEBUG__) {
    console.log('slack update response for rerun');
    console.log(await updateResponse.json());
  }

  return acknowledgeSlack(res);
}

async function processUpdatedOutput(
  res: NextApiResponse,
  payload: any,
  showRawOutput: boolean,
) {
  const view = (await buildRunResultView({
    ...(await getResults(payload)),
    showRawOutput,
  })) as any;

  view.view_id = payload.view.id;
  view.hash = payload.view.hash;

  await updateSlackModal(view, payload.api_app_id, payload.team.id);
  return acknowledgeSlack(res);
}

async function processFilenameSelection(res: NextApiResponse, payload: any) {
  const { slug } = JSON.parse(payload.view.private_metadata);
  const {
    api_app_id: appId,
    team: { id: teamId },
    view: { id: viewId, hash: viewHash },
  } = payload;

  const filename = payload.actions.find((a: any) => {
    return a.action_id === 'filename_select_action';
  })?.selected_option.value;

  const blocks = await buildInputModal(slug, filename);

  const newView = {
    view_id: viewId,
    hash: viewHash,
    view: buildSlackModalView({
      title: payload.view.title.text,
      callbackId: 'view-run-zipper-app',
      blocks,
      privateMetadata: payload.view.private_metadata,
      showSubmit: true,
    }),
  };

  const updateResponse = await updateSlackModal(newView, appId, teamId);

  if (__DEBUG__) {
    console.log('slack update response for filename selection');
    console.log(await updateResponse.json());
  }

  return acknowledgeSlack(res);
}

async function getResults(payload: any, existingRunId?: string) {
  const { slug, filename } = JSON.parse(payload.view.private_metadata);
  const inputs = buildRunUrlBodyParams(payload);
  const runId = existingRunId || crypto.randomUUID();

  const data = await fetch(
    `${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${slug}.${
      process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST
    }/${filename || 'main.ts'}`,
    {
      method: 'POST',
      body: JSON.stringify(inputs),
      headers: {
        'x-zipper-run-id': runId,
      },
    },
  )
    .then((response) => response.text())
    .then((text) => {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    });

  return { slug, filename, data, runId };
}

async function submissionHandler(res: NextApiResponse, payload: any) {
  if (payload.view.callback_id === 'view-run-zipper-app') {
    const view = await buildRunResultView(await getResults(payload));

    return res.status(200).json({
      response_action: 'update',
      view,
    });
  }
}

async function blockActionHandler(res: NextApiResponse, payload: any) {
  if (
    payload.actions[0]?.type === 'static_select' &&
    payload.actions[0]?.block_id === 'filename_select'
  ) {
    return processFilenameSelection(res, payload);
  }

  const actionId = payload.actions[0]?.action_id;

  if (actionId === 'edit_and_rerun_button') {
    return processRerun(res, payload);
  }

  if (actionId === 'view_raw_output_button') {
    return processUpdatedOutput(res, payload, true);
  }

  if (actionId === 'view_screenshot_output_button') {
    return processUpdatedOutput(res, payload, false);
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
