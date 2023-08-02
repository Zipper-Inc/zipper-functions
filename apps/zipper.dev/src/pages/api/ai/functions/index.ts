import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

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
      required: ['rawTypescriptCode'],
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
    You are a high skilled typescript developer, your task is to take the user request and generate typescript code. 
    Your code must export a handler function. You are not allowed to use classes. 
    Your final output should be a handler function that implements the user request.
    You should always only respond with the desired code, no additional text.
    Example: 
    User request: I want a applet that can greet the user by it's name
    Code: 
    export async function handler({name} : {name: string}){
      return \`Hello \${name}\`
    }

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
      model: 'gpt-3.5-turbo-16k-0613',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      functions,
    } as any);

    res
      .status(200)
      .json({ message: chatWithFunction.data.choices[0]?.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}
