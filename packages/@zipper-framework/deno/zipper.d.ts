// *
// * 🛑 DO NOT IMPORT ANYTHING INTO THIS FILE
// * 💾 It needs to be readable as is from the Monaco editor
// * 🗣️ Block comments in namespace will show up in editor
// *

// deno-lint-ignore-file no-explicit-any no-empty-interface

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
  export type Primitive = string | Date | number | boolean | null;

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
   * Export a Handler function named `handler` to turn your file into a path
   * You may pass in a input definition for autogenerated UI
   * @category Handler
   *
   * @example
   * // Define inputs without Zipper.Handler type
   * export function handler({ worldString } : { worldString: string }) {
   *   return `Hello ${worldString}`;
   * }
   *
   * // Define inputs with Zippler.Handler generic
   * export const handler: Zipper.Handler<{ worldString: string }> = ({
   *   worldString,
   * }) => `Hello ${worldString}`;
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
   * You must pass a string type to it, i.e. `Zipper.Action`
   */
  interface SpecialOutput<zipperType extends string> {
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
    (StackComponent | LinkComponent);

  export interface ComponentBase {
    type: string;
    props?: JSX.Props;
    children?: Component['children'];
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

  export namespace Component {
    /**
     * Creates an action
     */
    export function create(
      component: StackComponent | LinkComponent,
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
  export interface Storage {
    appId: string;
    get(key?: string): Promise<any>;
    set(key: string, value: unknown): Promise<any>;
    delete(key: string): Promise<any>;
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
      tag: string | ((props?: Props) => Component),
      props?: Props,
      ...children: Children
    ): Component;
    export function Fragment(fragment: Serializable): Serializable;
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
   * const allValues = await Zipper.storage.get();
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
  export const storage: Storage;
}

declare namespace JSX {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IntrinsicElements {
    /** @todo support HTML eventually */
  }
}

declare function Stack(
  props: Partial<Zipper.StackComponent['props']>,
): Zipper.Component;
declare function Row(
  props?: Partial<Zipper.StackComponent['props']>,
): Zipper.Component;
declare function Column(
  props?: Partial<Zipper.StackComponent['props']>,
): Zipper.Component;
declare function Link(props: Zipper.LinkComponent['props']): Zipper.Component;
