import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { groupCodeByFilename } from '~/utils/ai-generate-applet';

const conf = new Configuration({
  apiKey: process.env.OPENAI,
});

const auditSystemPrompt = `
  You're a software engineer, your task is to take the code and make sure that it is valid and everything needed to run is there.
  Dont remove any code, only add code if needed.
  Check if all types got defined and are correct.
  Check if all functions got defined and are correct.
  Remember, you need to mark things with export to import them in other files.
  After the audit, you should return the code with the fixes, but dont return any additional text. Just plain code.
  DONT. IMPORT. STUFF. FROM. ZIPPER.
`;

async function generateAuditedCode({
  userRequest,
  zipperCode,
}: {
  userRequest: string;
  zipperCode: string;
}) {
  if (conf.apiKey === undefined) {
    return { error: 'No API key provided.' };
  }

  const openai = new OpenAIApi(conf);
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-16k-0613',
      messages: [
        {
          role: 'system',
          content: auditSystemPrompt,
        },
        {
          role: 'user',
          content: userRequest,
        },
        {
          role: 'user',
          content: zipperCode,
        },
      ],
      temperature: 0,
    });

    return completion.data.choices[0]?.message;
  } catch (error: any) {
    if (error.response) {
      return {
        message: error.response.data?.error?.message ?? 'Unknown error',
      };
    } else {
      return {
        message: error.error?.message ?? 'Unknown error',
      };
    }
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { userRequest, zipperCode } = JSON.parse(request.body);
  const auditedCodeVersion = await generateAuditedCode({
    userRequest,
    zipperCode,
  });

  if (!auditedCodeVersion) {
    return NextResponse.json(
      { error: 'No response from OpenAI' },
      { status: 500 },
    );
  }

  if ('message' in auditedCodeVersion || 'error' in auditedCodeVersion) {
    return NextResponse.json(
      { error: auditedCodeVersion.error },
      { status: 500 },
    );
  }

  if (!auditedCodeVersion.content) {
    return NextResponse.json(
      { error: 'No code generate from OpenAI' },
      { status: 500 },
    );
  }

  const code = auditedCodeVersion.content;
  return response.status(200).json({
    raw: code,
    groupedByFilename: groupCodeByFilename(code),
  });
}
