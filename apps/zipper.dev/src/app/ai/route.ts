import { StreamingTextResponse, LangChainStream } from 'ai';
import { SequentialChain, LLMChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { PipelinePromptTemplate, PromptTemplate } from 'langchain/prompts';
import { readFrameworkFile } from '~/utils/read-file';

export const runtime = "nodejs";

export async function POST(req: Request) {
  const frameworkFile = await readFrameworkFile('zipper.d.ts');

  const { stream, handlers } = LangChainStream();
  const { prompt: initialPrompt } = await req.json(); 

  const llm = new OpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI, modelName: "gpt-3.5-turbo-16k-0613", streaming: true });

  const fullPrompt = PromptTemplate.fromTemplate(`
  {introduction}

  {example}
  {frameworkFile}
  {requestPrompt}
  `);

  const introductionPrompt = PromptTemplate.fromTemplate(`
  You are Typescript developer, high skilled with Deno creating Zipper Applets.
  Your responses must exclusively contain TypeScript code, without any additional text or explanation. 

  Your first task is to take the request sent by the user and generate typescript code that can be used to create a Zipper applet.
  Your second task is to take the generated application code and transform it into an applet that conforms to Zipper's conventions. 
  We are also providing you with the framework file of Zipper, which contains the code that is used to generate the applet code. You can use it as a reference.
  
  Note the following:
  - Each export function handler handler is an applet
  - Do not annotate the handler function with Zipper.Handler type, instead annotate they using async function handler(input: Input)
  - The Zipper namespace is globally available in the environment where the applet runs. Do NOT import anything from 'zipper', as it's already available.
  - The applet code should not include the zipper.d.ts file or modify it.
  - You can return JSX/html from the handler function if you want to return a UI component.
  - You can call Zipper Components using JSX syntax.
  - You may include necessary imports from esm.sh. 
  - You can use emoji in UI components.
  - Applets run in Deno environment, only use things that can run in this environment.
  - The applet should not import nothing from 'zipper' because it is already available in the environment and in the global namespace of Zipper applets.
  - You can import external packages via URLs, for instance from esm.sh, if needed.
  - If the request needs some additional contextual information like user information, app information, and request/response objects, use the 'HandlerContext' type from the Zipper namespace to access it.
  - Buttons always needs to be the 'Button' component from the Zipper namespace, and they must have all the required props.
  - Avoid using divs, you can use the 'Stack' component from the Zipper namespace instead.
  - html inputs are not supported yet, if you want to have a input you need to do something like this example 
  BRACE_OPEN
    name: Zipper.Action.create(BRACE_OPEN
      actionType: "button",
      showAs: "modal",
      text: "✨ Create a new flag",
      inputs: BRACE_OPEN name: "flag_" BRACE_CLOSE,
      path: "set.ts",
      run: false,
    BRACE_CLOSE),
  BRACE_CLOSE,.
  `);


  const examplePrompt = PromptTemplate.fromTemplate(`
    Here is an example of an applet that greets a user by their name:

    export function handler(input: BRACE_OPEN username : string BRACE_CLOSE) BRACE_OPEN
      return \`Hello, &#36;&#123;input.username&#125;!\`;
    BRACE_CLOSE

    Note that are some special characters in the code above, like BRACE_OPEN, BRACE_CLOSE, &#36;&#123; and &#125; that are used to create block and interpolate the username variable. You need to replace them with the correct characters.
  `);


  const frameworkPrompt = PromptTemplate.fromTemplate(`
    Here is the Zipper framework file for your reference, you can use everything from here without importing: {frameworkFile}
  `);
    
  const requestPromptTemplate = PromptTemplate.fromTemplate(`
    Applet Request: {request}.
  `)

  const composedPrompt = new PipelinePromptTemplate({
    pipelinePrompts: [
      {
        name: "introduction",
        prompt: introductionPrompt,
      },
      {
        name: "example",
        prompt: examplePrompt,
      },
      {
        name: "framework",
        prompt: frameworkPrompt,
      },
      {
        name: "requestPrompt",
        prompt: requestPromptTemplate,
      }
    ],
    finalPrompt: fullPrompt,
  });

  const createCodeChain = new LLMChain({
    prompt: composedPrompt,
    outputKey: "zipperCode",
    llm,
  })
  
  const zipperChain = new SequentialChain({
    chains: [createCodeChain],
    inputVariables: ["request", "frameworkFile"],
    outputVariables: ["zipperCode"],
    verbose: true,
  });

  const chainExecutionCall = await zipperChain.call({
    request: initialPrompt,
    frameworkFile: frameworkFile,
  })

  return new StreamingTextResponse(chainExecutionCall.zipperCode)
}