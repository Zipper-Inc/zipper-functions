import { OpenAIStream, streamToResponse } from 'ai';
import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai-edge';
import { z } from 'zod';
import {
  generateBasicTSCode,
  generateBasicTSCodeArgsSchema,
} from '../generate/applet';
import {
  generateZipperAppletVersion,
  generateZipperAppletVersionArgsSchema,
} from '../zipper-version/applet';

const conf = new Configuration({
  apiKey: process.env.OPENAI,
});

export type AiFunctionTypes =
  | 'generate_basic_typescript'
  | 'generate_zipper_version'
  | 'audit_zipper_version';

export interface ChatGPTFunction {
  name: AiFunctionTypes;
  description: string;
  parameters: {
    type: string;
    properties: {
      [key: string]: {
        type: string;
        description: string;
        enum?: string[];
      };
    };
    required: string[];
  };
}

const functions: ChatGPTFunction[] = [
  {
    name: 'generate_basic_typescript',
    description: 'Generate a basic typescript function',
    parameters: {
      type: 'object',
      properties: {
        userRequest: {
          type: 'string',
          description: 'The user request to create a function for',
        },
      },
      required: ['userRequest'],
    },
  },
  {
    name: 'generate_zipper_version',
    description:
      'Format the previously generate code to match Zipper definition',
    parameters: {
      type: 'object',
      properties: {
        rawTypescriptCode: {
          type: 'string',
          description: 'The code to format',
        },
        userRequest: {
          type: 'string',
          description: 'The user request to create a function for',
        },
      },
      required: ['rawTypescriptCode', 'userRequest'],
    },
  },
  {
    name: 'audit_zipper_version',
    description:
      'Make sure that the code is valid, and everything needed to run is there',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code to format',
        },
      },
      required: ['code'],
    },
  },
];

const systemPrompt = `
    You are a high skilled typescript developer, your task is to take the user request and generate typescript code that can be used in the zipper app.
    Your task is split into 3 functions:
    1. generate_basic_typescript: This function takes the user request and generates a basic typescript function.
    2. generate_zipper_version: This function takes the raw typescript code and formats it to match the zipper definition.
    3. audit_zipper_version: This function takes the formatted code and makes sure that it is valid and everything needed to run is there.
    You must always execute the functions in the order above.
    All functions must be executed.
    You must not remove anything from the user request. Leave it as it is, just pass it to the function.
    You should always only respond with the desired code, no additional text.
    You must not return any code before all functions have been executed.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = req.body;
  const { messages } = JSON.parse(body);

  const openai = new OpenAIApi(conf);

  try {
    const chatWithFunction = await openai.createChatCompletion({
      model: 'gpt-4-0613',
      stream: true,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      functions,
      function_call: { name: 'generate_basic_typescript' },
    });

    const stream = OpenAIStream(chatWithFunction, {
      experimental_onFunctionCall: async (
        { name, arguments: functionArgs },
        createFunctionCallMessages,
      ) => {
        console.log('Function call', name, functionArgs);

        if (name === 'generate_basic_typescript') {
          const args = generateBasicTSCodeArgsSchema.parse(functionArgs);
          const basicTypescriptCode = await generateBasicTSCode(
            args.userRequest,
          );
          const newMessages = createFunctionCallMessages(basicTypescriptCode);
          return openai.createChatCompletion({
            messages: [...messages, ...newMessages],
            stream: true,
            model: 'gpt-4-0613',
            temperature: 0,
            functions,
            function_call: { name: 'generate_zipper_version' },
          });
        }

        if (name === 'generate_zipper_version') {
          const args =
            generateZipperAppletVersionArgsSchema.parse(functionArgs);

          const zipperAppletVersion = await generateZipperAppletVersion({
            userRequest: args.userRequest,
            rawTypescriptCode: args.rawTypescriptCode,
          });

          const newMessages = createFunctionCallMessages(zipperAppletVersion);
          return openai.createChatCompletion({
            messages: [...messages, ...newMessages],
            stream: true,
            model: 'gpt-4-0613',
            functions,
            temperature: 0,
            function_call: { name: 'audit_zipper_version' },
          });
        }

        if (name === 'audit_zipper_version') {
          const args = auditTSCodeArgsSchema.parse(functionArgs);
          const audited = await auditTSCode(args.code);
          const newMessages = createFunctionCallMessages(audited);

          return openai.createChatCompletion({
            messages: [...messages, ...newMessages],
            stream: true,
            model: 'gpt-4-0613',
            temperature: 0,
            functions,
          });
        }
      },
    });

    return streamToResponse(stream, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

const auditCodePrompt = `
  You are a high skilled typescript developer, your task is to take the code and make sure that it is valid and everything needed to run is there.
  You should always only respond with the desired code, no additional text.
  Check if all types got defined and are correct.
  Check if all functions got defined and are correct.
  DONT. IMPORT. STUFF. FROM. ZIPPER.
`;

const auditTSCodeArgsSchema = z.object({
  code: z.string(),
});

export async function auditTSCode(code: string) {
  const openai = new OpenAIApi(conf);
  const completation = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo-16k-0613',
    messages: [
      {
        role: 'system',
        content: auditCodePrompt,
      },
      {
        role: 'user',
        content: code,
      },
    ],
  });
  const data = await completation.json();
  return JSON.stringify({ data: data.choices[0]?.message });
}
