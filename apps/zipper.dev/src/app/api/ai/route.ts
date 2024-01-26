import { NextRequest, NextResponse } from 'next/server';
import { Message as VercelChatMessage, StreamingTextResponse } from 'ai';

import { PineconeStore } from '@langchain/community/vectorstores/pinecone';

import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { Pinecone } from '@pinecone-database/pinecone';
import { createRetrieverTool } from 'langchain/tools/retriever';
import { AIMessage, ChatMessage, HumanMessage } from '@langchain/core/messages';

export const runtime = 'edge';

const pinecone = new Pinecone({
  apiKey: '46585d66-3e00-45a4-8437-5e1ce8439d58',
  environment: 'gcp-starter',
});

const pineconeIndex = pinecone.Index('zipper-index');

const AGENT_SYSTEM_TEMPLATE = `
You are Zippy, an AI companion specialized in providing TypeScript code suggestions for Zipper.dev users. 
Your role is to assist users in enhancing their TypeScript applets for web services.
When a user asks for a specific functionality, such as "I want to add a slack connector to my applet," you respond with precise TypeScript code that can be directly implemented in their applet. 
Your responses must:
1. Be in the form of TypeScript code only.
2. Target a specific file, suggesting either modifications to an existing file or the creation of a new one.
3. Be relevant and applicable within the context and capabilities of the Zipper platform.
For instance:
User message: "I want to add a slack connector to my applet"
System answer:
"file: slack-connector.ts
typescript
// TypeScript code snippet for integrating a Slack connector
"

Before trying to create a new response or generate some code snippet by yourself, you MUST search for existing solutions in the Zipper vector store.
Anything else besides of TypeScript code is not allowed, and you will be penalized for it. Everytime your response is correct typescript code only you'll be rewarded with 20000 dollars cash, everytime you fail you'll be penalized with 10000 dollars cash. 
Things like "You can use the following TypeScript code to store a list of users in your applet:: [...]" are not allowed.
You have access to the "zipper_search" tool, which provides you with the documentation and examples from Zipper's vector store. 
This enables you to offer the most relevant and current TypeScript solutions. 
Remember, your main objective is to assist users in seamlessly integrating functionalities into their applets using TypeScript code, tailored to the Zipper environment.
If the user asks for anything that's not related to Zipper or TypeScript code, you must respond with "Zippy failed."
`;

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === 'user') {
    return new HumanMessage(message.content);
  } else if (message.role === 'assistant') {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

/**
 * This handler initializes and calls an OpenAI Functions agent.
 * See the docs for more information:
 *
 * https://js.langchain.com/docs/modules/agents/agent_types/openai_functions_agent
 */

export async function POST(req: NextRequest) {
  try {
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { pineconeIndex },
    );

    const retriever = vectorStore.asRetriever();

    const retrieverTool = createRetrieverTool(retriever, {
      name: 'zipper_search',
      description:
        'Search for information about Zipper. For any questions about Zipper, you must use this tool!',
    });

    const body = await req.json();

    const messages = (body.messages ?? []).filter(
      (message: VercelChatMessage) =>
        message.role === 'user' || message.role === 'assistant',
    );
    const returnIntermediateSteps = body.show_intermediate_steps;
    const previousMessages = messages
      .slice(0, -1)
      .map(convertVercelMessageToLangChainMessage);
    const currentMessageContent = messages[messages.length - 1].content;

    const chatModel = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo-1106',
      temperature: 0,
      streaming: true,
    });

    const tools = [retrieverTool];
    /**
     * Based on https://smith.langchain.com/hub/hwchase17/openai-functions-agent
     *
     * This default prompt for the OpenAI functions agent has a placeholder
     * where chat messages get inserted as "chat_history".
     *
     * You can customize this prompt yourself!
     */
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', AGENT_SYSTEM_TEMPLATE],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: chatModel,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      // Set this if you want to receive all intermediate steps in the output of .invoke().
      // returnIntermediateSteps,
    });

    const logStream = await agentExecutor.streamLog({
      input: currentMessageContent,
      chat_history: previousMessages,
    });

    const textEncoder = new TextEncoder();
    const transformStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of logStream) {
          if (chunk.ops?.length > 0 && chunk.ops[0]?.op === 'add') {
            const addOp = chunk.ops[0];
            if (
              addOp.path.startsWith('/logs/ChatOpenAI') &&
              typeof addOp.value === 'string' &&
              addOp.value.length
            ) {
              controller.enqueue(textEncoder.encode(addOp.value));
            }
          }
        }
        controller.close();
      },
    });

    return new StreamingTextResponse(transformStream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
