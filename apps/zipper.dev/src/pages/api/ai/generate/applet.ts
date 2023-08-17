import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

const conf = new Configuration({
  apiKey: process.env.OPENAI,
});

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
  const body = JSON.parse(req.body);
  const { userRequest } = body;

  const openai = new OpenAIApi(conf);

  const completion = await openai.createChatCompletion({
    model: 'gpt-4-0613',
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
  });

  if (!completion.data.choices[0]?.message?.content) {
    return res.status(500).json({ message: 'No response from AI' });
  }

  const code = completion.data.choices[0].message.content;
  return res.status(200).json({ message: code });
}
