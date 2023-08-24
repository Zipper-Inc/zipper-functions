import type { NextApiResponse } from 'next';

// TODO: this needs to come from slack and be stored in a DB
const BOT_TOKEN = 'xoxb-5595568931968-5762958141557-DcPeKgbTuTQgEyYE7avjS49M';
const SLACK_VIEW_UPDATE_URL = 'https://slack.com/api/views.update';
const SLACK_VIEW_OPEN_URL = 'https://slack.com/api/views.open';
const HEADERS = {
  ['Content-Type']: 'application/json; charset=utf-8',
  Authorization: `Bearer ${BOT_TOKEN}`,
};

export function getRunUrl(slug: string, filename: string) {
  // TODO: don't hard code this
  return `http://${slug}.localdev.me:3002/run/${filename}/api/json`;
}

export async function runApp(url: string, body: string) {
  const runResponse = await fetch(url, {
    method: 'POST',
    body,
  });

  return runResponse.json();
}

export async function getAppInfo(slug: string, filename?: string) {
  // TODO: Get the real appInfo url
  // Event better do this with a code import instead of http.
  const appInfoUrl = `https://matt.zipper.ngrok.app/api/app/info/${slug}`;
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

export function updateSlackModal(view: any) {
  return fetch(SLACK_VIEW_UPDATE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(view),
  });
}

export function openSlackModal(view: any) {
  return fetch(SLACK_VIEW_OPEN_URL, {
    method: 'POST',
    headers: HEADERS,
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

function buildEnumInput({ key, details, optional }: ZipperInput) {
  const values = details?.values || [];
  const options = values.map((v: ZipperInputDetailValue) => v.value);

  return {
    type: 'input',
    block_id: `${key}_select`,
    label: {
      type: 'plain_text',
      text: key,
    },
    element: buildSelectElement(key, `Select ${key}`, options),
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
  values: ZipperInputDetailValue[];
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
  const queryString = inputKeys.reduce((acc: any, k: string) => {
    return { ...acc, ...parseSubmittedInput(inputs[k]) };
  }, {});
  return queryString;
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
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: JSON.stringify(data),
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

  return buildSlackModalView({
    title: `${slug}`,
    callbackId: 'view-zipper-app-results',
    blocks,
    privateMetadata: `{ "slug": "${slug}", "filename": "${filename}" }`,
    showSubmit: false,
  });
}
