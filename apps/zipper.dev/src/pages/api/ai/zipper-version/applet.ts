import { AICodeOutput } from '@zipper/types';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { z } from 'zod';

const conf = new Configuration({
  apiKey: process.env.OPENAI,
});

async function generateZipperAppletVersion({
  userRequest,
  rawTypescriptCode,
}: {
  userRequest: string;
  rawTypescriptCode: string;
}) {
  const zipperDefinitions = `
  Here is a list of all the definitions you can use in your code:
  // zipper.d.ts contents 
  /**
 * ✨
 * The global namespace where Zipper-specific, non-standard APIs are located.
 * ✨
 */
declare namespace Zipper {
  /**
   * The most atomic unit of data in Zipper
   * @category Primitive
   */
  export type Primitive = string | Date | number | boolean | null | undefined;

  /**
   * Zipper objects can only be keyed by string or number
   * @category Primitive
   * @see Serializable
   */
  export type PrimitiveKey = string | number;

  /**
   * Any data structure that can me serialized into JSON
   * @category Primitive
   */
  export type Serializable =
    | Action
    | Component
    | Primitive
    | Serializable[]
    | { [key: PrimitiveKey]: Serializable };

  /**
   * A single value inside an Inputs object
   * @category Handler
   * @see Inputs
   * @see Handler
   */
  export type InputValue = undefined | Serializable;

  /**
   * The inputs for a Handler function
   * It's passed as a single object with named parameters
   * @category Handler
   * @see Handler
   */
  export type Inputs = { [key: string]: InputValue };

  /**
   * The output result of a Handler function
   * @category Handler
   * @see Handler
   */
  export type Output = void | Serializable;

  /**
   * Additional context that is passed to every handler
   * @category Handler
   * @see Handler
   */
  export type HandlerContext = {
    /**
     * The request object sent to this handler
     */
    request: Request;

    /**
     * An editable response object
     * Changes made to these properties will overwrite the default response
     */
    response: Partial<ResponseInit & { body: BodyInit }>;

    /**
     * Information about the user who called this app
     * (blank if public)
     */
    userInfo: undefined | UserInfo;

    /**
     * Meta info about the applet itself
     */
    appInfo: AppInfo;

    /**
     * The ID for this particular run
     */
    runId: string;
  };

  /**
   * A callable Handler function in Zipper's framework
   * Export a Handler function named 'handler' to turn your file into a path
   * You may pass in a input definition for autogenerated UI
   * @category Handler
   *
   * @example
   * // Define inputs without Zipper.Handler type
   * export function handler({ worldString } : { worldString: string }) {
   *   return Hello /$/{worldString}';
   * }
   *
   * // Define inputs with Zippler.Handler generic
   * export const handler: Zipper.Handler<{ worldString: string }> = ({
   *   worldString,
   * }) => 'Hello /$/{worldString}';
   */
  export type Handler<I = Inputs> = (
    inputs: I,
    context: HandlerContext,
  ) => Output | Promise<Output>;

  /**
   * The configuration for how each Handler is displayed or run
   * Can be exported at the page level
   */
  export type HandlerConfig<I = Inputs> = Partial<{
    run: boolean | I;
    auth: boolean;
    description: Partial<{
      title: string;
      subtitle: string;
    }>;
    inputs: {
      [Property in keyof I]: Partial<{
        label: string;
        description: string;
        defaultValue: I[Property];
        placeholder: string;
      }>;
    };
  }>;

  export type BootPayload = {
    ok: true;
    slug: string;
    version: string;
    appId: string;
    deploymentId: string;
    configs: { [path: string]: HandlerConfig };
  };

  /**
   * These are special objects we can return such as Actions
   * You must pass a string type to it, i.e. 'Zipper.Action'
   */
  interface SpecialOutput<zipperType extends 'Zipper./$/{string}'> {
    $zipperType: zipperType;
  }

  /**
   * Actions
   */
  interface ActionBase<I> {
    /**
     * Determines how we should show the input
     */
    showAs: 'modal' | 'expanded' | 'replace_all' | 'refresh';
    /**
     * The path to the handler for this action
     */
    path: string;
    /**
     * The visible text for the Action
     */
    text?: string;
    /**
     * Run the path with provided inputs and show the output
     * default = true
     */
    run?: boolean;
    /**
     * The inputs to run the function with
     */
    inputs?: I;
  }

  interface ButtonAction<I = Inputs> extends ActionBase<I> {
    /**
     * The type of action this is
     */
    actionType: 'button';
  }

  interface DropdownAction<I = Inputs> extends ActionBase<I> {
    /**
     * The type of action this is
     */
    actionType: 'dropdown';
    /**
     * Array of options in the dropdown.
     * Selected value is sent to the inputs function
     */
    options: Partial<{
      [Property in keyof I]: {
        label: string;
        value: I[Property];
      }[];
    }>;
  }

  export type Action<I = Inputs> = SpecialOutput<'Zipper.Action'> &
    (ButtonAction<I> | DropdownAction<I>);

  export type Component = SpecialOutput<'Zipper.Component'> &
    (StackComponent | LinkComponent | MarkdownComponent | HtmlElement);

  export interface ComponentBase {
    type: string;
    props?: JSX.Props;
    children?: Serializable;
  }

  type SelfPosition =
    | 'center'
    | 'end'
    | 'flex-end'
    | 'flex-start'
    | 'self-end'
    | 'self-start'
    | 'start';

  export interface StackComponent extends ComponentBase {
    type: 'stack';
    props?:
      | {
          direction: 'row' | 'column';
          divider?: boolean;
          align?: SelfPosition | 'baseline' | 'normal' | 'stretch';
        }
      | JSX.Props;
    children: Serializable;
  }

  export interface LinkComponent extends ComponentBase {
    type: 'link';
    props: {
      href: string;
      target?: '_blank' | '_self';
    };
    children: string;
    text?: string;
  }

  export interface MarkdownComponent extends ComponentBase {
    type: 'markdown';
    children: string;
  }

  export interface HtmlElement extends ComponentBase {
    type: 'html./$/{HtmlTag}';
  }

  export namespace Component {
    /**
     * Creates an action
     */
    export function create(
      component:
        | StackComponent
        | LinkComponent
        | MarkdownComponent
        | HtmlElement,
    ): Component;
  }

  export namespace Action {
    /**
     * Creates an action
     */
    export function create<I = Inputs>(
      action: ButtonAction<I> | DropdownAction<I>,
    ): Action<I>;
  }

  export namespace Log {
    type Method =
      | 'log'
      | 'debug'
      | 'info'
      | 'warn'
      | 'error'
      | 'table'
      | 'clear'
      | 'time'
      | 'timeEnd'
      | 'count'
      | 'assert';

    export interface Message {
      id: string;
      // The log method
      method: Method;
      // The arguments passed to console API
      data: Serializable[];
      // Time of log
      timestamp: number;
    }

    export type MessageorDisplay = Omit<Message, 'timestamp'> & {
      timestamp?: string;
    };
  }

  /**
   * Handle some special routing behavior
   * @category Runtime
   */
  export namespace Router {
    type Route = SpecialOutput<'Zipper.Router'>;

    export interface Redirect extends Route {
      redirect: string;
    }

    export interface NotFound extends Route {
      notFound: true;
    }

    export interface Error extends Route {
      error: string;
    }

    export function redirect(url: URL | string): Router.Redirect;
    export function notFound(): Router.NotFound;
    export function error(...data: unknown[]): Router.Error;
  }

  /**
   * Simple async key value store, one per app
   * @category Storage
   */
  export interface Storage<Value extends Serializable = Serializable> {
    appId: string;
    getAll<V extends Value = Value>(): Promise<{ [k: string]: V }>;
    get<V extends Value = Value>(key: string): Promise<V>;
    set<V extends Value = Value>(
      key: string,
      value: V,
    ): Promise<{ key: string; value: V }>;
    delete(key: string): Promise<true>;
  }

  /**
   * Information about the user who called this app
   * (blank if public)
   * @category Runtime
   */
  export type UserInfo = {
    email?: string;
  };

  /**
   * Meta info about the app itself
   * @category Runtime
   */
  export type AppInfo = {
    id: string;
    slug: string;
    version: string;
    url: string;
    connectorsWithUserAuth: string[];
  };

  /**
   * The namespace specific to the relay service
   * zipper.run <=> Deno deploy <=> @zipper/framework middleware
   * @category Runtime
   */
  export namespace Relay {
    /**
     * The Relay request body
     * POST by zipper.run to @zipper/framework
     */
    export type RequestBody = {
      error?: string;
      appInfo: AppInfo;
      runId: string;
      inputs: Inputs;
      userInfo?: UserInfo;
      originalRequest: { url: string; method: string };
      path?: string;
      userId: string;
    };
  }

  export namespace JSX {
    export type Props = Record<string, Serializable>;
    export type Children = Component['children'][];
    export function createElement(
      component: (props?: Props) => Component,
      props?: Props,
      ...children: Children
    ): Component;
    export function createElement(
      tag: Zipper.HtmlElement['type'],
      props?: Props,
      ...children: Children
    ): Component;
    export function Fragment({
      children,
    }: {
      children: Serializable;
    }): typeof children;
  }

  // *
  // * Zipper Global Properties
  // *

  /**
   * An object containing useful environment variables
   *
   * @example const myEnvVariable = Zipper.env.MY_ENV_VARIABLE;
   */
  export const env: Record<string, string>;

  /**
   * Simple async key value store, one per app
   *
   * @example
   * // get all values in storage
   * const allValues = await Zipper.storage.getAll();
   *
   * // get a single valueby key
   * const singleValue = await Zipper.storage.get('my-storage-key');
   *
   * // update a value by key
   * await Zipper.storage.set('another-storage-key', someStorageValue);
   *
   * // delete a value by key
   * await Zipper.storage.delete('another-store-key');
   */
  export const storage: Storage<Serializable>;
}

// Global components
type StackProps = Partial<Zipper.StackComponent['props']>;
declare function Stack(props: StackProps): Zipper.Component;
declare function Row(props?: StackProps): Zipper.Component;
declare function Column(props?: StackProps): Zipper.Component;

type LinkProps = Zipper.LinkComponent['props'];
declare function Link(props: LinkProps): Zipper.Component;

type ButtonProps<I> = Omit<Zipper.ButtonAction<I>, 'actionType' | 'text'>;
declare function Button<I = Zipper.Inputs>(
  props: ButtonProps<I>,
): Zipper.Action;

type MarkdownProps = { text?: string };
declare function Markdown(props: MarkdownProps): Zipper.Component;
declare function md(
  strings: TemplateStringsArray,
  ...expr: string[]
): Zipper.Component;

type DropdownProps<I> = Omit<Zipper.DropdownAction<I>, 'actionType'>;
declare function Dropdown<I = Zipper.Inputs>(
  props: DropdownProps<I>,
): Zipper.Action;`;

  const zipperSystemPrompt = `
  # Convert TypeScript to Zipper Applet
  Zipper allows creating serverless apps called applets. 
  Applets contain handler functions that use types like Handler and Serializable.
  The output should:
  - Use Zipper handler functions and types
  - You don't need to import anything from Zipper, everything is already available in the global namespace
  - Output should be only raw code, no additional text, no snippets, no \`\`\`typescript\`\`\` tags
  - Handler function should be always a declarative function, no arrow functions
  - Dont type the handler function because Zipper.Handler is already inferred
  - Zipper.Output type isnt necessary as well because it's inferred
  - Try to use the Zipper functionalities like storage to store data, If the user says "I want a list" this data should be saved using Zipper.storage
  - If the user needs to perform any action in the items you should use Zipper.Action
  - Zipper applets can contain one or many files, it is essential to always output the main.ts file first and is required that in the top of the file you ad a //file: main.ts comment indicating that this is the main file, this is required also for every file you output
  - If you detect in your main function that you have other functions to perform actions you can extract this functions to other files, just output the code of that functions after the main.ts file and add the name of the file as a comment in the top, here is a example: 
  // file: main.ts
  export function handler() {
    const list = Zipper.storage.get('list');
    return list.map((item) => {
      ...item,
      actions: [
        Zipper.Action.create({
          actionType: 'button',
          path: 'deleteitem',
          text: 'Delete',
          showAs: 'refresh',
          inputs: {
            id: item.id,
          },
        }),
      ],
    });
  }
  // file: deleteItem.ts
  type Item = {
    id: string;
  }
  export function handler({ id }) {
    const list = await Zipper.storage.get<Item[]>('list');
    const newList = list.filter((item) => item.id !== id);
    Zipper.storage.set('list', newList);
  }
  - Always use await for Zipper.storage methods
  - Always try to create the necessary interfaces and types for stuff you want to create like items, lists, etc
  - Remember to think in applets as regular web apps, if your user wants a applet that is a "List of items" your main.ts file should return the list of items your user wants to see
  - If you are using Zipper.Actions, make sure you add the showAs property as it is mandatory
  - Path property in Zipper.Actions should be always the name of the file with .ts extension and file names are always lowercase
  - Always remember if you create other files this files MUST export a handler function named 'handler'
  - All the files you create must have a config object for each file, this config object should be always in the end of the file
  - Before you start outputting a new file, output the config object for the previous file like this: 
  // file: main.ts
  export function handler() { ... }
  export const config: Zipper.HandlerConfig = { ... }
  // file: deleteItem.ts
  export function handler() { ... }
  export const config: Zipper.HandlerConfig = { ... }
  - If you create another file to handle a functionality of your applet, remember to remove the old function from the main.ts file
  - The first code you receive does not uses the Zipper framework, make sure you refactor it to use it, if you see for example data being saved in a raw array, make sure you refactor it to use Zipper.storage
  - It's always nice to have the description property so the user can understand what the applet does
  - You can use the global components like Stack, Row, Column, Link, Button, Markdown, md, Dropdown, etc
  - Don't use arrow functions, always use declarative functions
  - Always use declarative functions for the handler function
  - Always avoid to use patterns like this: 
  export async function handler({ action, contact }: { action: string, contact: any }) {
    if (action === 'add') {
      const list = await Zipper.storage.get('list');
      list.push(contact);
    } else if (action === 'delete') {
      ...
    }
  }
  This is a bad pattern, you should always create a new file for each action and return the list in the main function with actions as buttons
  - NEVER, NEVER, NEVER left a file with implementation to do like "// Code to create a new contact", this is bad for the user, always try to make a basic implementation of the user request
  - Config objects should be always in the end of the code
  - Config objects are mandatory, you should always add one to the output
  - Pay attention to user requirements and try to use the tools that are available in global namespace, for example, if the user says "I want something that can manage a list of items", you should output
  - Make sure you implement everything you use in your applet, if you use a User interface, make sure to create it and add to the output, if you create a Zipper.Action that uses a edituser.ts file, make sure to create the file and implement the necessary code
  - Remember to not user anything that you don't have access to, for example, Zipper dont have access to useState from React so you can't use it  
  - Never create functions like this: 
  export async function handler({}) {
    // Define your applet code here
  }
  We need at least the most basic implementation of the user request
  Here is a example of a config object: 
  export const config: Zipper.HandlerConfig<Inputs> = {
    description: {
      title: "Greetings!",
      subtitle: 'A simple "Hello, world!" example on Zipper',
    },
    inputs: {
      name: {
        label: "Name",
        placeholder: "Enter a place to greet",
        description: "For example, entering 'world' would output 'Hello, world!",
      },
    },
  };
  `;

  if (conf.apiKey === undefined) {
    console.log('No API key provided.');
    return { error: 'No API key provided.' };
  }

  const openai = new OpenAIApi(conf);
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-16k-0613',
      messages: [
        {
          role: 'system',
          content: zipperSystemPrompt,
        },
        {
          role: 'system',
          content: zipperDefinitions,
        },
        {
          role: 'user',
          content: userRequest,
        },
        {
          role: 'user',
          content: rawTypescriptCode,
        },
      ],
      temperature: 0,
    });

    return completion.data.choices[0]?.message;
  } catch (error: any) {
    console.log(error);
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
      return {
        message: error.response.data?.error?.message ?? 'Unknown error',
      };
    } else {
      console.log(error);
      return {
        message: error.error?.message ?? 'Unknown error',
      };
    }
  }
}

const FileWithTsExtension = z.string().refine((value) => value.endsWith('.ts'));

function groupCodeByFilename(inputs: string): AICodeOutput[] {
  const output: AICodeOutput[] = [];
  const lines = inputs.split('\n');

  let currentFilename: AICodeOutput['filename'] = 'main.ts';
  let currentCode = '';

  for (const line of lines) {
    if (line.trim().startsWith('// file:')) {
      if (currentCode !== '') {
        output.push({ filename: currentFilename, code: currentCode });
        currentCode = '';
      }
      let file = line.trim().replace('// file:', '').trim();
      if (!FileWithTsExtension.safeParse(file)) {
        file += '.ts';
      }
      currentFilename = file as AICodeOutput['filename'];
    } else {
      currentCode += line + '\n';
    }
  }

  // Add the last code block
  if (currentCode !== '') {
    output.push({ filename: currentFilename, code: currentCode });
  }

  return output;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { userRequest, rawTypescriptCode } = JSON.parse(request.body);
  const zipperAppletVersion = await generateZipperAppletVersion({
    userRequest,
    rawTypescriptCode,
  });

  if (!zipperAppletVersion)
    return NextResponse.json(
      { error: 'No response from OpenAI' },
      { status: 500 },
    );

  if ('message' in zipperAppletVersion || 'error' in zipperAppletVersion) {
    return NextResponse.json(
      { error: zipperAppletVersion.error },
      { status: 500 },
    );
  }

  return response.status(200).json({
    raw: zipperAppletVersion.content,
    groupedByFilename: groupCodeByFilename(zipperAppletVersion.content ?? ''),
  });
}