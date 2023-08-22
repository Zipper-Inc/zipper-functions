import type { NextApiRequest, NextApiResponse } from 'next';
import { queues } from '../../../server/queue';

async function getAppInfo(slug: string) {
  const appInfoUrl = `https://matt.zipper.ngrok.app/api/app/info/${slug}`;
  const appInfoResponse = await fetch(appInfoUrl, {
    method: 'POST',
    body: '{"filename":"main.ts"}',
  });

  return appInfoResponse.json();
}

function buildScriptSelect(scripts: string[]) {
  return scripts.map((scriptName: string) => {
    return {
      text: {
        type: 'plain_text',
        text: scriptName,
      },
      value: scriptName,
    };
  });
}

function buildSlackView(triggerId: string, appName: string, scripts: string[]) {
  return {
    trigger_id: triggerId,
    view: {
      type: 'modal',
      callback_id: 'view-helpdesk',
      title: {
        type: 'plain_text',
        text: appName,
      },
      submit: {
        type: 'plain_text',
        text: 'Submit',
      },
      blocks: [
        {
          type: 'section',
          block_id: 'section678',
          text: {
            type: 'mrkdwn',
            text: 'filename',
          },
          accessory: {
            action_id: 'text1234',
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select an file',
            },
            options: buildScriptSelect(scripts),
          },
        },
      ],
    },
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('SLACK GET INPUTS');
  console.log(JSON.stringify(req.body));
  const slug = req.body.text;
  const triggerId = req.body.trigger_id;

  // get app info
  const appInfo = await getAppInfo(slug);
  console.log(appInfo);

  // build slack view
  const view = buildSlackView(
    triggerId,
    appInfo.data.app.name,
    appInfo.data.runnableScripts,
  );

  // open modal
  const token = 'xoxb-5595568931968-5762958141557-DcPeKgbTuTQgEyYE7avjS49M';
  const viewOpenResponse = await fetch('https://slack.com/api/views.open', {
    method: 'POST',
    headers: {
      ['Content-Type']: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(view),
  });
  const body = await viewOpenResponse.json();
  console.log({ body });

  // queues.slackGetInputs.add(
  //   'slackGetInputs',
  //   {
  //     responseUrl: req.body.response_url,
  //     triggerId: req.body.trigger_id,
  //     slug: req.body.text,
  //   },
  //   {},
  // );

  // acknowledge slash command
  const response = 'ok';
  return res.status(200).send(response);
}
