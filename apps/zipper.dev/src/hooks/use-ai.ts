import { AICodeOutput } from '@zipper/types';
import { getZipperApiUrl } from '@zipper/utils';
import { ChatRequest, FunctionCallHandler, nanoid, CreateMessage } from 'ai';

import { useChat } from 'ai/react';
import type { AiFunctionTypes } from '~/pages/api/ai/functions';

import type { ChatGPTMessage } from '~/pages/api/ai/generate/applet';

export const useAI = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/ai/functions',
    experimental_onFunctionCall: functionCallHandler,
  });

  return true;
};

const functionCallHandler: FunctionCallHandler = async (
  chatMessages,
  functionCall,
) => {
  if (functionCall.name === 'generate_basic_typescript') {
    if (!functionCall.arguments) return;

    const args: { userRequest: string } = JSON.parse(functionCall.arguments);
    const basicCodeResponse = await getBasicCode(args.userRequest);

    const functionResponse: ChatRequest = {
      messages: [
        ...chatMessages,
        {
          id: nanoid(),
          name: 'generate_basic_typescript',
          role: 'function' as const,
          content: basicCodeResponse.content,
        },
      ],
    };

    return functionResponse;
  }

  if (functionCall.name === 'generate_zipper_version') {
    if (!functionCall.arguments) return;

    const args: {
      userRequest: string;
      rawTypescriptCode: string;
    } = JSON.parse(functionCall.arguments);

    const zipperCode = await getZipperCode(args);

    const functionResponse: ChatRequest = {
      messages: [
        ...chatMessages,
        {
          id: nanoid(),
          name: 'generate_zipper_version',
          role: 'function' as const,
          content: zipperCode.raw,
        },
      ],
    };

    return functionResponse;
  }

  if (functionCall.name === 'audit_zipper_version') {
  }
};

const getZipperCode = async ({
  userRequest,
  rawTypescriptCode,
}: {
  userRequest: string;
  rawTypescriptCode: string;
}) => {
  const response = await fetch(
    `${getZipperApiUrl()}/ai/zipper-version/applet`,
    {
      method: 'POST',
      body: JSON.stringify({
        userRequest,
        rawTypescriptCode,
      }),
    },
  );

  // Handle response
  const data = await response.json();

  if (data.error) {
    console.log(data.error);
    throw new Error('Failed to generate Zipper code');
  }

  return data as { raw: string; groupedByFilename: AICodeOutput[] };
};

type OpenAIFunctionOutput = {
  role: 'assistant';
  content: null;
  function_call?: {
    name: AiFunctionTypes;
    arguments: string;
  };
};

const getOpenAIFunction = async (
  messages: ChatGPTMessage[],
): Promise<OpenAIFunctionOutput> => {
  const response = await fetch(`${getZipperApiUrl()}/ai/functions`, {
    method: 'POST',
    body: JSON.stringify({
      messages,
    }),
  });

  console.log(messages);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.message;
};

// getBasicCode implementation
const getBasicCode = async (message: string): Promise<CreateMessage> => {
  const response = await fetch(`${getZipperApiUrl()}/ai/generate/applet`, {
    method: 'POST',
    body: JSON.stringify({
      userRequest: message,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.message;
};
