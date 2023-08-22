import type { NextApiResponse } from 'next';

const BOT_TOKEN = 'xoxb-5595568931968-5762958141557-DcPeKgbTuTQgEyYE7avjS49M';

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
};

export function buildSlackModalView({
  title,
  callbackId,
  blocks,
  privateMetadata,
}: BuildSlackViewInputs) {
  return {
    type: 'modal',
    callback_id: callbackId,
    title: {
      type: 'plain_text',
      text: title,
    },
    submit: {
      type: 'plain_text',
      text: 'Submit',
    },
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
    buildSelectBlock(
      'filename_select',
      'filename',
      'filename_select_action',
      'Select an file',
      scripts,
    ),
  ];
}

export function buildSelectBlock(
  blockId: string,
  text: string,
  actionId: string,
  placeHolderText: string,
  options: string[],
) {
  return {
    type: 'section',
    block_id: blockId,
    text: {
      type: 'mrkdwn',
      text,
    },
    accessory: {
      action_id: actionId,
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: placeHolderText,
      },
      options: buildSelectOptions(options),
    },
  };
}

function buildEnumInput(input: ZipperInput) {
  console.log('build enum');
  console.log(input);
  const values = input.details?.values || [];
  const options = values.map((v: ZipperInputDetailValue) => v.value);
  return buildSelectBlock(
    `${input.key}_select`,
    input.key,
    `${input.key}_select_action`,
    `Select ${input.key}`,
    options,
  );
}

function buildStringInput(input: ZipperInput) {
  return {
    type: 'input',
    block_id: input.key,
    label: {
      type: 'plain_text',
      text: input.key,
    },
    element: {
      type: 'plain_text_input',
      action_id: `${input.key}_input_action`,
    },
  };
}

function buildMultilineInput(input: ZipperInput) {
  return {
    type: 'input',
    block_id: input.key,
    label: {
      type: 'plain_text',
      text: input.key,
    },
    element: {
      type: 'plain_text_input',
      action_id: `${input.key}_input_action`,
      multiline: true,
    },
  };
}

function buildDateInput(input: ZipperInput) {
  return {
    type: 'section',
    block_id: input.key,
    text: {
      type: 'mrkdwn',
      text: input.key,
    },
    accessory: {
      type: 'datepicker',
      action_id: `${input.key}_date_action`,
      initial_date: new Date().toISOString().split('T')[0],
      placeholder: {
        type: 'plain_text',
        text: 'Select a date',
      },
    },
  };
}

function buildBooleanInput(input: ZipperInput) {
  return buildSelectBlock(
    `${input.key}_boolean_select`,
    input.key,
    `${input.key}_boolean_select_action`,
    `Select ${input.key}`,
    ['true', 'false'],
  );
}

function buildNumberInput(input: ZipperInput) {
  return {
    type: 'input',
    element: {
      type: 'number_input',
      is_decimal_allowed: false,
      action_id: `${input.key}_number_action`,
    },
    label: {
      type: 'plain_text',
      text: input.key,
      emoji: true,
    },
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

export function buildViewInputblock(inputs: ZipperInput[]) {
  console.log('build an input for ');
  return inputs.map((i: ZipperInput) => {
    console.log({ type: i.type });
    console.log({ func: inputTypeFuncMap[i.type] });
    return inputTypeFuncMap[i.type](i);
  });
}
