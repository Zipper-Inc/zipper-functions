import { StreamingTextResponse, LangChainStream } from 'ai';
import { SequentialChain, LLMChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { PipelinePromptTemplate, PromptTemplate } from 'langchain/prompts';

import fs from 'fs/promises';
import path from 'path';

export const runtime = "nodejs";

export async function readFrameworkFile(filename: string) {
  return await fs.readFile(path.resolve('./src/app/ai/', filename), 'utf8');
}

export async function POST(req: Request) {
  const frameworkFile = await readFrameworkFile('zipper.d.ts');

  const { stream, handlers } = LangChainStream();
  const { body } = await req.json(); 

  const appletLLM = new OpenAI({ temperature: 0, openAIApiKey: "", modelName: "gpt-3.5-turbo", streaming: true });
  const appletTemplate = `As a TypeScript developer, your task is to create asynchronous functions called handler based on my applet requests. 
  Your responses must exclusively contain TypeScript code, without any additional text or explanation. 
  You may include necessary imports from esm.sh. Each handler function is an applet, and I will specify the requirements for these applets. 
  Remember that this applets will be deployed into a Deno oak server, so you can use the oak library for handling requests and responses and this is a Deno environment so only use things that can run in this environment. eg: react is not available in this environment.
  Example: If I ask for an applet that greets a user by their name, you should reply only with the code, like this: 
  "async function handler(username: string): Promise<string> &#123; return "Hello &#36;&#123;username&#125;" &#125;"
  Note that are some special characters in the code above, like &#36;&#123; and &#125; that are used to interpolate the username variable. You need to replace them with the correct characters.
  Applet Request: {request}.
  `;

  const appletPromptTemplate = new PromptTemplate({
    template: appletTemplate,
    inputVariables: ["request"],
  });

  const appletChain = new LLMChain({
    llm: appletLLM,
    prompt: appletPromptTemplate,
    outputKey: "code",
  });

  const llm = new OpenAI({ temperature: 0, openAIApiKey: "", modelName: "gpt-3.5-turbo", streaming: true });

  const fullPrompt = PromptTemplate.fromTemplate(`
  {introduction}

  {example}
  {frameworkFile}

  {zipperNamespacePrompt}`);

  const introductionPrompt = PromptTemplate.fromTemplate(`
  You are a Zipper Applet specialist working with TypeScript and Deno.
  Your task is to take the generated application code and transform it into an applet that conforms to Zipper's conventions and standards. You have the zipper.d.ts file available to you for referencing types from the Zipper namespace.
  
  Note the following:
  - The Zipper namespace is globally available in the environment where the applet runs. Do NOT import anything from 'zipper', as it's already available.
  - You should use types from the Zipper namespace to structure the applet code correctly.
  - Use the 'HandlerContext' type from the Zipper namespace for accessing additional contextual information like user information, app information, and request/response objects.
  - The applet code should not include the zipper.d.ts file or modify it.
  - The applet should not import nothing from 'zipper' because it is already available in the environment and in the global namespace of Zipper applets.
  - You can import external packages via URLs, for instance from esm.sh, if needed.
  - We are also providing you with the framework file of Zipper, which contains the code that is used to generate the applet code. You can use it as a reference.
  `);

  const examplePrompt = PromptTemplate.fromTemplate(`
    Here is the raw typescript code generated to the applet: {code}
  `);


  const frameworkPrompt = PromptTemplate.fromTemplate(`
    Here is the zipper framework file for your reference, you can use everything from here without importing: {frameworkFile}
  `);
  

  const zipperNamespacePrompt = PromptTemplate.fromTemplate(`
    Here is the applet code with the Zipper namespace:
  `);

  const composedPrompt = new PipelinePromptTemplate({
    pipelinePrompts: [
      {
        name: "introduction",
        prompt: introductionPrompt,
      },
      {
        name: "framework",
        prompt: frameworkPrompt,
      },
      {
        name: "example",
        prompt: examplePrompt,
      },
      {
        name: "zipperNamespacePrompt",
        prompt: zipperNamespacePrompt,
      },
    ],
    finalPrompt: fullPrompt,
  });

  const reviewChain = new LLMChain({
    llm: llm,
    prompt: composedPrompt,
    outputKey: "zipperVersion",
  })
  
  const zipperChain = new SequentialChain({
    chains: [appletChain, reviewChain],
    inputVariables: ["request", "frameworkFile"],
    outputVariables: ["code", "zipperVersion"],
    verbose: true,
  });

  const chainExecutionCall = await zipperChain.call({
    request: body,
    frameworkFile: frameworkFile,
  })

  return new StreamingTextResponse(chainExecutionCall.zipperVersion)
}