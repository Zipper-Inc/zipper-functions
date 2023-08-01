
import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';

export const conf = new Configuration({
  apiKey: process.env.OPENAI,
});

export const systemPrompt = `
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
