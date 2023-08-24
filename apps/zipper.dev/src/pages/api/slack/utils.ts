import { m } from 'framer-motion';
import type { NextApiResponse } from 'next';

const BOT_TOKEN = 'xoxb-5595568931968-5762958141557-DcPeKgbTuTQgEyYE7avjS49M';

export async function runApp(url: string, body: string) {
  const runResponse = await fetch(url, {
    method: 'POST',
    body,
  });

  return runResponse.json();
}

export async function getAppInfo(slug: string, filename?: string) {
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
          text: 'Submit',
        }
      : undefined,
    private_metadata: privateMetadata,
    blocks,
  };
}

export function updateSlackModal(view: any) {
  return fetch('https://slack.com/api/views.update', {
    method: 'POST',
    headers: {
      ['Content-Type']: 'application/json; charset=utf-8',
      Authorization: `Bearer ${BOT_TOKEN}`,
    },
    body: JSON.stringify(view),
  });
}

export function openSlackModal(view: any) {
  return fetch('https://slack.com/api/views.open', {
    method: 'POST',
    headers: {
      ['Content-Type']: 'application/json; charset=utf-8',
      Authorization: `Bearer ${BOT_TOKEN}`,
    },
    body: JSON.stringify(view),
  });
}

export function acknowledgeSlack(res: NextApiResponse) {
  return res.status(200).json({ success: true });
}

function buildSelectOptions(options: string[]) {
  return options.map((scriptName: string) => {
    return {
      text: {
        type: 'plain_text',
        text: scriptName,
      },
      value: scriptName,
    };
  });
}

export function buildFilenameSelect(scripts: string[]) {
  return [
    {
      type: 'section',
      block_id: 'filename_select',
      text: { type: 'mrkdwn', text: '*Filename*' },
      accessory: buildSelectElement(
        'filename_select_action',
        'Select an file',
        scripts,
      ),
    },
  ];
}

export function buildSelectElement(
  actionId: string,
  placeHolderText: string,
  options: string[],
) {
  return {
    type: 'static_select',
    action_id: actionId,
    placeholder: {
      type: 'plain_text',
      text: placeHolderText,
    },
    options: buildSelectOptions(options),
  };
}

function buildEnumInput({ key, details, optional }: ZipperInput) {
  const values = details?.values || [];
  const options = values.map((v: ZipperInputDetailValue) => v.value);
  console.log('BUILD ENUM ' + key);
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
  console.log('build an input for ');
  return inputs.map((i: ZipperInput) => {
    console.log('INPUT:--------');
    console.log(i);
    console.log({ type: i.type });
    console.log({ func: inputTypeFuncMap[i.type] });
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
