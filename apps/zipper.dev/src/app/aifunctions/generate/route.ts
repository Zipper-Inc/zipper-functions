// aifunctions generate route
import { NextResponse } from 'next/server';
import { OpenAIApi } from 'openai';
import { conf, systemPrompt } from '../route';

export async function POST(req: Request) {
  const { userRequest } = await req.json();
  const openai = new OpenAIApi(conf);

  const chatWithFunction = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo-16k-0613',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userRequest,
      },
    ],
  } as any);

  return NextResponse.json({
    message: chatWithFunction.data.choices[0]?.message,
  });
}
