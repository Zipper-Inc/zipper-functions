import type { NextApiResponse } from 'next';
import { initApplet } from '@zipper-inc/client-js';
import { prisma } from '../../../server/prisma';
import { decryptFromBase64 } from '@zipper/utils';

// TODO: The bot token needs to come from slack and be stored in a DB
const SLACK_VIEW_UPDATE_URL = 'https://slack.com/api/views.update';
const SLACK_VIEW_OPEN_URL = 'https://slack.com/api/views.open';
const ZIPPER_APP_INFO_URL = 'https://zipper.dev/api/app/info/';
const MAX_TEXT_LENGTH = 2000;

async function buildHeaders(slackAppId: string, slackTeamId: string) {
  const installation = await prisma.slackZipperSlashCommandInstall.findFirst({
    where: {
      appId: slackAppId,
      teamId: slackTeamId,
    },
  });

  if (!installation) throw new Error('Instalation not found');

  const token = decryptFromBase64(
    installation.encryptedBotToken,
    process.env.ENCRYPTION_KEY,
  );

  return {
    ['Content-Type']: 'application/json; charset=utf-8',
    Authorization: `Bearer ${token}`,
  };
}

export function runApp(slug: string, path: string, inputs: any) {
  return initApplet(slug)
    .path(path)
    .run(inputs)
    .catch((e) => `invalid response ${e}`);
}

export async function getAppInfo(slug: string, filename?: string) {
  const appInfoUrl = `${ZIPPER_APP_INFO_URL}${slug}`;
  const appInfoResponse = await fetch(appInfoUrl, {
    method: 'POST',
    body: `{"filename":"${filename}"}`,
  });

  return appInfoResponse.json();
}

export type BuildSlackViewInputs = {
  title: string;
  callbackId: string;
  blocks: any[];
  privateMetadata: string;
  showSubmit: boolean;
};

export function buildSlackModalView({
  title,
  callbackId,
  blocks,
  privateMetadata,
  showSubmit: showSubmit,
}: BuildSlackViewInputs) {
  return {
    type: 'modal',
    callback_id: callbackId,
    title: {
      type: 'plain_text',
      text: title,
    },
    submit: showSubmit
      ? {
          type: 'plain_text',
          text: 'Run Applet',
        }
      : undefined,
    private_metadata: privateMetadata,
    blocks,
  };
}

export async function updateSlackModal(
  view: any,
  slackAppId: string,
  slackTeamId: string,
) {
  return fetch(SLACK_VIEW_UPDATE_URL, {
    method: 'POST',
    headers: await buildHeaders(slackAppId, slackTeamId),
    body: JSON.stringify(view),
  });
}

export async function openSlackModal(
  view: any,
  slackAppId: string,
  slackTeamId: string,
) {
  return fetch(SLACK_VIEW_OPEN_URL, {
    method: 'POST',
    headers: await buildHeaders(slackAppId, slackTeamId),
    body: JSON.stringify(view),
  });
}

export function acknowledgeSlack(res: NextApiResponse) {
  return res.status(200).json({ success: true });
}

function buildSelectOption(text: string, value: string) {
  return {
    text: {
      type: 'plain_text',
      text,
    },
    value,
  };
}

function buildAllSelectOptions(options: string[]) {
  return options.map((scriptName: string) => {
    return buildSelectOption(scriptName, scriptName);
  });
}

export function buildFilenameSelect(scripts: string[], selected?: string) {
  return [
    {
      type: 'section',
      block_id: 'filename_select',
      text: { type: 'mrkdwn', text: '*Filename*' },
      accessory: buildSelectElement(
        'filename_select_action',
        'Select an file',
        scripts,
        selected,
      ),
    },
  ];
}

export function buildSelectElement(
  actionId: string,
  placeHolderText: string,
  options: string[],
  selected?: string,
) {
  const initialOption = selected
    ? buildSelectOption(selected, selected)
    : undefined;

  return {
    type: 'static_select',
    action_id: actionId,
    placeholder: {
      type: 'plain_text',
      text: placeHolderText,
    },
    options: buildAllSelectOptions(options),
    initial_option: initialOption,
  };
}

function getValuesFromDetails(details: ZipperInputDetails): string[] {
  if (!details.values) return [];
  return details.values.map((v) => {
    return typeof v === 'string' ? v : v.value;
  });
}

function buildEnumInput({ key, details, optional }: ZipperInput) {
  const options = details ? getValuesFromDetails(details) : [];

  return {
    type: 'input',
    block_id: `${key}_select`,
    label: {
      type: 'plain_text',
      text: key,
    },
    element: buildSelectElement(key, `Select ${key}`, options as string[]),
    optional,
  };
}

function buildStringInput({ key, optional }: ZipperInput) {
  return {
    type: 'input',
    block_id: key,
    label: {
      type: 'plain_text',
      text: key,
    },
    element: {
      type: 'plain_text_input',
      action_id: key,
    },
    optional,
  };
}

function buildMultilineInput({ key, optional }: ZipperInput) {
  return {
    type: 'input',
    block_id: key,
    label: {
      type: 'plain_text',
      text: key,
    },
    element: {
      type: 'plain_text_input',
      action_id: key,
      multiline: true,
    },
    optional,
  };
}

function buildDateInput({ key, optional }: ZipperInput) {
  return {
    type: 'input',
    block_id: `${key}_label_id`,
    label: {
      type: 'plain_text',
      text: key,
    },
    element: {
      type: 'datepicker',
      action_id: key,
      initial_date: new Date().toISOString().split('T')[0],
      placeholder: {
        type: 'plain_text',
        text: 'Select a date',
      },
    },
    optional,
  };
}

function buildBooleanInput({ key, optional }: ZipperInput) {
  return {
    type: 'input',
    block_id: `${key}_boolean_select`,
    label: {
      type: 'plain_text',
      text: key,
    },
    element: buildSelectElement(key, `Select ${key}`, ['true', 'false']),
    optional,
  };
}

function buildNumberInput({ key, optional }: ZipperInput) {
  return {
    type: 'input',
    block_id: `${key}_block_id`,
    element: {
      type: 'number_input',
      is_decimal_allowed: false,
      action_id: key,
    },
    label: {
      type: 'plain_text',
      text: key,
      emoji: true,
    },
    optional,
  };
}

const inputTypeFuncMap: any = {
  string: buildStringInput,
  date: buildDateInput,
  boolean: buildBooleanInput,
  number: buildNumberInput,
  enum: buildEnumInput,
  array: buildMultilineInput,
  unknown: buildMultilineInput,
  any: buildMultilineInput,
};

export type ZipperInputDetailValue = {
  key: string;
  value: string;
};

export type ZipperInputDetails = {
  values: ZipperInputDetailValue[] | string[];
};

export type ZipperInput = {
  key: string;
  type: string;
  optional: boolean;
  details?: ZipperInputDetails;
};

export function buildViewInputBlock(inputs: ZipperInput[]) {
  return inputs.map((i: ZipperInput) => {
    return inputTypeFuncMap[i.type](i);
  });
}

const inputParseFuncMap: {
  [key: string]: (label: string, input: any) => { [key: string]: string };
} = {
  static_select: (label: string, input: any) => {
    return { [label]: input.selected_option.value };
  },
  plain_text_input: (label: string, input: any) => {
    return { [label]: input.value };
  },
  datepicker: (label: string, input: any) => {
    return { [label]: input.selected_date };
  },
  number_input: (label: string, input: any) => {
    return { [label]: input.value };
  },
};

function parseSubmittedInput(input: any) {
  const key = Object.keys(input)[0];
  if (!key) throw new Error('Unknown unput');

  const type: string = input[key].type;
  if (!type || !inputParseFuncMap[type]) throw new Error('Unknown unput');

  return inputParseFuncMap[type]?.(key, input[key]);
}

export function buildRunUrlBodyParams(payload: any) {
  const inputs = payload.view.state.values;
  const inputKeys = Object.keys(inputs);
  const queryParams = inputKeys.reduce((acc: any, k: string) => {
    return { ...acc, ...parseSubmittedInput(inputs[k]) };
  }, {});
  return queryParams;
}

export type PrivateMetadata = {
  slug?: string;
  filename?: string;
};

export function buildPrivateMetadata(privateMetadata: PrivateMetadata) {
  return JSON.stringify(privateMetadata);
}

export async function buildInputModal(
  slug: string,
  filename: string,
  viewId: string,
  viewHash: string,
) {
  const appInfo = await getAppInfo(slug, filename);

  const blocks = [
    ...buildFilenameSelect(appInfo.data.runnableScripts, filename),
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

  return {
    view_id: viewId,
    hash: viewHash,
    view: buildSlackModalView({
      title: `${appInfo.data.app.name}`,
      callbackId: 'view-run-zipper-app',
      blocks,
      privateMetadata: buildPrivateMetadata({ slug, filename }),
      showSubmit: true,
    }),
  };
}

export function buildRunResultView(slug: string, filename: string, data: any) {
  // Slack has a 250kb limit on view size so trim the response if needed.
  const fullText = JSON.stringify(data);
  const truncateText = fullText.length > MAX_TEXT_LENGTH;

  const resultsBlocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: truncateText
          ? `${fullText.substring(0, MAX_TEXT_LENGTH)}...`
          : fullText,
      },
    },
  ];

  if (truncateText) {
    const url = `https://${slug}.zipper.run/run/${filename}`
    resultsBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Showing truncated results',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Full results',
          emoji: true,
        },
        value: 'full_results',
        url,
        action_id: 'zipper_link',
      },
    });
  }

  const blocks = [
    ...resultsBlocks,
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

  return buildSlackModalView({
    title: `${slug}`,
    callbackId: 'view-zipper-app-results',
    blocks,
    privateMetadata: `{ "slug": "${slug}", "filename": "${filename}" }`,
    showSubmit: false,
  });
}
