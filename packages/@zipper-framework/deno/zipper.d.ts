// deno-lint-ignore-file no-explicit-any

// *
// * 🛑 DO NOT IMPORT ANYTHING INTO THIS FILE
// * 💾 It needs to be readable as is from the Monaco editor
// * 🗣️ Block comments in namespace will show up in editor
// *

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
    // internal comment: this is the zipper.run request URL
    /**
     * Metadata about the original request
     */
    request: Relay.RequestBody['originalRequest'];

    /**
     * The request object sent to this handler by the relay middleware
     */
    relayRequest: Request;

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
    appInfo: RelayAppInfo;

    /**
     * The ID for this particular run
     */
    runId: string;

    /**
     * Auth tokens for each service the user has individually authed against
     */
    userConnectorTokens: { [service: string]: string };

    /**
     * A generic stash for anything that needs to persist across handlers
     */
    stash: {
      readonly get: <T = any>(key: string) => T | undefined;
      readonly set: <T = any>(key: string, value: T) => void;
      [key: string]: any;
    };
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
  export type Handler<I = Inputs> = {
    (inputs: I, context: HandlerContext): Output | Promise<Output>;
    __handlerMeta?: {
      name: string;
      path: string;
    };
    config?: HandlerConfig<I>;
  };

  /**
   * The configuration for how each Handler is displayed or run
   * Can be exported at the page level
   */
  export type HandlerConfig<I = Inputs> = Partial<{
    run: boolean | I;
    description: Partial<{
      title: string;
      subtitle: string;
      body: string;
    }>;
    inputs: {
      [Property in keyof I]: Partial<{
        label: string;
        description: string;
        defaultValue: I[Property];
        placeholder: string;
      }>;
    };
    schedules: {
      [scheduleName: string]: {
        cron: string;
        inputs?: I;
      };
    };
  }>;

  enum InputType {
    string = 'string',
    number = 'number',
    boolean = 'boolean',
    date = 'date',
    array = 'array',
    object = 'object',
    any = 'any',
    enum = 'enum',
    file = 'FileUrl',
    unknown = 'unknown',
    union = 'union',
  }

  type LiteralNode =
    | { type: InputType.boolean; details?: { literal: boolean } }
    | { type: InputType.number; details?: { literal: number } }
    | { type: InputType.string; details?: { literal: string } };

  type ParsedNode =
    | LiteralNode
    | { type: InputType.date }
    | {
        type: InputType.array;
        details?:
          | { isUnion: true; values: ParsedNode[] }
          | { isUnion: false; values: ParsedNode };
      }
    | { type: InputType.any }
    | { type: InputType.file }
    | { type: InputType.unknown }
    | { type: InputType.union; details: { values: ParsedNode[] } }
    | {
        type: InputType.enum;
        details: {
          values: Array<
            | string // enum Foo { Bar, Baz }
            | {
                // enum Foo { Bar = 'bar', Baz = 'baz' }
                key: string | undefined;
                value: string | undefined;
              }
          >;
        };
      }
    | {
        type: InputType.object;
        details: {
          properties: {
            key: string;
            details: ParsedNode;
          }[];
        };
      };

  type InputParam = {
    key: string;
    node: ParsedNode;
    optional: boolean;
    name?: string;
    label?: string;
    placeholder?: string;
    description?: string;
    defaultValue?: Zipper.Serializable;
    value?: Zipper.Serializable;
  };

  export type BootPayload = {
    ok: true;
    slug: string;
    version: string;
    appId: string;
    deploymentId: string;
    configs: { [path: string]: HandlerConfig };
    frameworkVersion: string;
    bootInfo: {
      app: {
        id: string;
        slug: string;
        name: string | null;
        description: string | null;
        updatedAt: Date | string | null;
        isPrivate: boolean;
        requiresAuthToRun: boolean;
        organizationId: string | null;
        isDataSensitive: boolean;
        createdById: string | null;
        editors: { userId: string; appId: string; isOwner: boolean }[];
        appAuthor?: {
          name: string;
          organization: string;
          image: string;
          orgImage: string;
        };
        canUserEdit?: boolean | undefined;
      };
      connectors: {
        type: string;
        appId: string;
        isUserAuthRequired: boolean;
        clientId?: string;
        userScopes: string[];
        workspaceScopes: string[];
      }[];
      inputs: InputParam[];
      parsedScripts: Record<string, Record<string, any>>;
      runnableScripts: string[];
      metadata?: Record<string, string | undefined>;
      entryPoint: {
        filename: string;
        editUrl: string;
      };
    };
  };

  /**
   * These are special objects we can return such as Actions
   * You must pass a string type to it, i.e. `Zipper.Action`
   */
  interface SpecialOutput<zipperType extends `Zipper.${string}`> {
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
    /**
     * The handler meta object
     */
    handler?: Pick<Zipper.Handler<I>, '__handlerMeta'>;
  }

  interface ButtonAction<I = Inputs>
    extends ActionBase<I>,
      ButtonComponentProps {
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
    (
      | StackComponent
      | LinkComponent
      | MarkdownComponent
      | HtmlElement
      | LineChartComponent
      | BarChartComponent
    );

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

  export interface ButtonComponentProps {
    width?: string;
    colorScheme?: 'purple' | 'blue' | 'red' | 'green' | 'yellow';
    variant?: 'outline' | 'solid' | 'link' | 'ghost';
    isDisabled?: boolean;
  }

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
    type: `html.${HtmlTag}`;
  }

  export interface ChartBase extends ComponentBase {
    props: {
      boxHeight?: number | string;

      enableGridX?: boolean;
      enableGridY?: boolean;

      axisBottom?: Partial<{
        legend: string;
        [key: string]: any;
      }>;
      axisLeft?: Partial<{
        legend: string;
        [key: string]: any;
      }>;
      [key: string]: any;
    };
  }

  export interface BarChartComponent extends ChartBase {
    type: 'barChart';
    props: ChartBase['props'] & {
      data: { [key: string]: string | number }[];
      keys?: string[];
      groupMode?: 'grouped' | 'stacked';
      layout?: 'horizontal' | 'vertical';
      reverse?: boolean;
      margin?: Partial<{
        bottom: number;
        left: number;
        right: number;
        top: number;
      }>;
      enableLabel?: boolean;
      label?: string;
    };
  }

  export interface LineChartComponent extends ChartBase {
    type: 'lineChart';
    props: ChartBase['props'] & {
      data: {
        id: string | number;
        data: {
          x?: string | number | Date | null;
          y?: string | number | Date | null;
          [key: string]: any;
        }[];
        [key: string]: any;
      }[];

      curve?:
        | 'basis'
        | 'cardinal'
        | 'catmullRom'
        | 'linear'
        | 'monotoneX'
        | 'monotoneY'
        | 'natural'
        | 'step'
        | 'stepAfter'
        | 'stepBefore';

      lineWidth?: number;

      colors?: string;
      enableArea?: boolean;
      enablePoints?: boolean;
      pointSize?: number;
    };
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
        | HtmlElement
        | LineChartComponent
        | BarChartComponent,
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
      timestamp: Date;
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
    get<V extends Value = Value>(key: string): Promise<V> | undefined;
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
    userId?: string;
    email?: string;
    displayName?: string;
    canUserEdit?: boolean;
  };

  /**
   * Meta info about the app itself
   * @category Runtime
   */
  export type RelayAppInfo = {
    id: string;
    slug: string;
    version: string;
    url?: string;
    connectorsWithUserAuth?: string[];
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
      appInfo: RelayAppInfo;
      runId: string;
      inputs: Inputs;
      userInfo?: UserInfo;
      originalRequest: {
        url: string;
        method: string;
        headers: Record<string, string>;
        body: Record<string, any>;
        queryParameters: Record<string, string>;
      };
      path?: string;
      action?: string;
      userId: string;
      userConnectorTokens: Record<string, string>;
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
   * You can also add a variable with the .set method
   *
   * @example
   * const myEnvVariable = Zipper.env.MY_ENV_VARIABLE;
   * const myEnvVariable = Zipper.env.get('MY_ENV_VARIABLE');
   * Zipper.env.set('MY_ENV_VARIABLE', 'my value'); // value on next run
   */
  export const env: Omit<Record<string, string>, 'get' | 'set'> & {
    get: (key: string) => string | void;
    set: (key: string, value: string) => Promise<void>;
  };

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

  export type FileUrl = string;
}

// Global components

type StackProps = Partial<Zipper.StackComponent['props']>;
declare function Stack(props: StackProps): Zipper.Component;
declare function Row(props?: StackProps): Zipper.Component;
declare function Column(props?: StackProps): Zipper.Component;

type LinkProps = Zipper.LinkComponent['props'];
declare function Link(props: LinkProps): Zipper.Component;

type ButtonProps<I> = Omit<Zipper.ButtonAction<I>, 'actionType' | 'text'>;
type ButtonPropsWithHandler<I> = Omit<ButtonProps<I>, 'path'> & {
  handler: Zipper.Handler<I>;
};

declare function Button<I = Zipper.Inputs>(
  props: ButtonProps<I> & Zipper.ButtonComponentProps,
): Zipper.Action<I>;

declare function Button<I = Zipper.Inputs>(
  props: ButtonPropsWithHandler<I> & Zipper.ButtonComponentProps,
): Zipper.Action<I>;

type DropdownProps<I> = Omit<Zipper.DropdownAction<I>, 'actionType'>;
type DropdownPropsWithHandler<I> = Omit<DropdownProps<I>, 'path'> & {
  handler: Zipper.Handler<I>;
};

declare function Dropdown<I = Zipper.Inputs>(
  props: DropdownProps<I>,
): Zipper.Action<I>;

declare function Dropdown<I = Zipper.Inputs>(
  props: DropdownPropsWithHandler<I>,
): Zipper.Action<I>;

type LineChartProps = Zipper.LineChartComponent['props'];
declare function LineChart(props: LineChartProps): Zipper.Component;

type BarChartProps = Zipper.BarChartComponent['props'];
declare function BarChart(props: BarChartProps): Zipper.Component;

type MarkdownProps = { text?: string };
declare function Markdown(props: MarkdownProps): Zipper.Component;
declare function md(
  strings: TemplateStringsArray,
  ...expr: string[]
): Zipper.Component;

// All HTML Tags
type HtmlTag =
  | 'a'
  | 'abbr'
  | 'acronym'
  | 'address'
  | 'applet'
  | 'area'
  | 'article'
  | 'aside'
  | 'audio'
  | 'b'
  | 'base'
  | 'basefont'
  | 'bdi'
  | 'bdo'
  | 'bgsound'
  | 'big'
  | 'blink'
  | 'blockquote'
  | 'body'
  | 'br'
  | 'button'
  | 'canvas'
  | 'caption'
  | 'center'
  | 'cite'
  | 'code'
  | 'col'
  | 'colgroup'
  | 'content'
  | 'data'
  | 'datalist'
  | 'dd'
  | 'decorator'
  | 'del'
  | 'details'
  | 'dfn'
  | 'dir'
  | 'div'
  | 'dl'
  | 'dt'
  | 'element'
  | 'em'
  | 'embed'
  | 'fieldset'
  | 'figcaption'
  | 'figure'
  | 'font'
  | 'footer'
  | 'form'
  | 'frame'
  | 'frameset'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'head'
  | 'header'
  | 'hgroup'
  | 'hr'
  | 'html'
  | 'i'
  | 'iframe'
  | 'img'
  | 'input'
  | 'ins'
  | 'isindex'
  | 'kbd'
  | 'keygen'
  | 'label'
  | 'legend'
  | 'li'
  | 'link'
  | 'listing'
  | 'main'
  | 'map'
  | 'mark'
  | 'marquee'
  | 'menu'
  | 'menuitem'
  | 'meta'
  | 'meter'
  | 'nav'
  | 'nobr'
  | 'noframes'
  | 'noscript'
  | 'object'
  | 'ol'
  | 'optgroup'
  | 'option'
  | 'output'
  | 'p'
  | 'param'
  | 'plaintext'
  | 'pre'
  | 'progress'
  | 'q'
  | 'rp'
  | 'rt'
  | 'ruby'
  | 's'
  | 'samp'
  | 'script'
  | 'section'
  | 'select'
  | 'shadow'
  | 'small'
  | 'source'
  | 'spacer'
  | 'span'
  | 'strike'
  | 'strong'
  | 'style'
  | 'sub'
  | 'summary'
  | 'sup'
  | 'table'
  | 'tbody'
  | 'td'
  | 'template'
  | 'textarea'
  | 'tfoot'
  | 'th'
  | 'thead'
  | 'time'
  | 'title'
  | 'tr'
  | 'track'
  | 'tt'
  | 'u'
  | 'ul'
  | 'var'
  | 'video'
  | 'wbr'
  | 'xmp';

declare namespace Http {
  /**
   * HTTP request methods
   *
   * @see https://en.wikipedia.org/wiki/HTTP#Request_methods
   */
  export enum Method {
    /**
     * The `CONNECT` method establishes a tunnel to the server identified by the
     * target resource.
     */
    CONNECT = 'CONNECT',

    /**
     * The `DELETE` method deletes the specified resource.
     */
    DELETE = 'DELETE',

    /**
     * The `GET` method requests a representation of the specified resource.
     * Requests using GET should only retrieve data.
     */
    GET = 'GET',

    /**
     * The `HEAD` method asks for a response identical to that of a GET request,
     * but without the response body.
     */
    HEAD = 'HEAD',

    /**
     * The `OPTIONS` method is used to describe the communication options for the
     * target resource.
     */
    OPTIONS = 'OPTIONS',

    /**
     * The PATCH method is used to apply partial modifications to a resource.
     */
    PATCH = 'PATCH',

    /**
     * The `POST` method is used to submit an entity to the specified resource,
     * often causing a change in state or side effects on the server.
     */
    POST = 'POST',

    /**
     * The `PUT` method replaces all current representations of the target
     * resource with the request payload.
     */
    PUT = 'PUT',

    /**
     * The `TRACE` method performs a message loop-back test along the path to the
     * target resource.
     */
    TRACE = 'TRACE',
  }

  /**
   * Hypertext Transfer Protocol (HTTP) response status codes.
   * @see https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
   */
  export enum StatusCode {
    /**
     * The server has received the request headers and the client should proceed to send the request body
     * (in the case of a request for which a body needs to be sent; for example, a POST request).
     * Sending a large request body to a server after a request has been rejected for inappropriate headers would be inefficient.
     * To have a server check the request's headers, a client must send Expect: 100-continue as a header in its initial request
     * and receive a 100 Continue status code in response before sending the body. The response 417 Expectation Failed indicates the request should not be continued.
     */
    CONTINUE = 100,

    /**
     * The requester has asked the server to switch protocols and the server has agreed to do so.
     */
    SWITCHING_PROTOCOLS = 101,

    /**
     * A WebDAV request may contain many sub-requests involving file operations, requiring a long time to complete the request.
     * This code indicates that the server has received and is processing the request, but no response is available yet.
     * This prevents the client from timing out and assuming the request was lost.
     */
    PROCESSING = 102,

    /**
     * Standard response for successful HTTP requests.
     * The actual response will depend on the request method used.
     * In a GET request, the response will contain an entity corresponding to the requested resource.
     * In a POST request, the response will contain an entity describing or containing the result of the action.
     */
    OK = 200,

    /**
     * The request has been fulfilled, resulting in the creation of a new resource.
     */
    CREATED = 201,

    /**
     * The request has been accepted for processing, but the processing has not been completed.
     * The request might or might not be eventually acted upon, and may be disallowed when processing occurs.
     */
    ACCEPTED = 202,

    /**
     * SINCE HTTP/1.1
     * The server is a transforming proxy that received a 200 OK from its origin,
     * but is returning a modified version of the origin's response.
     */
    NON_AUTHORITATIVE_INFORMATION = 203,

    /**
     * The server successfully processed the request and is not returning any content.
     */
    NO_CONTENT = 204,

    /**
     * The server successfully processed the request, but is not returning any content.
     * Unlike a 204 response, this response requires that the requester reset the document view.
     */
    RESET_CONTENT = 205,

    /**
     * The server is delivering only part of the resource (byte serving) due to a range header sent by the client.
     * The range header is used by HTTP clients to enable resuming of interrupted downloads,
     * or split a download into multiple simultaneous streams.
     */
    PARTIAL_CONTENT = 206,

    /**
     * The message body that follows is an XML message and can contain a number of separate response codes,
     * depending on how many sub-requests were made.
     */
    MULTI_STATUS = 207,

    /**
     * The members of a DAV binding have already been enumerated in a preceding part of the (multistatus) response,
     * and are not being included again.
     */
    ALREADY_REPORTED = 208,

    /**
     * The server has fulfilled a request for the resource,
     * and the response is a representation of the result of one or more instance-manipulations applied to the current instance.
     */
    IM_USED = 226,

    /**
     * Indicates multiple options for the resource from which the client may choose (via agent-driven content negotiation).
     * For example, this code could be used to present multiple video format options,
     * to list files with different filename extensions, or to suggest word-sense disambiguation.
     */
    MULTIPLE_CHOICES = 300,

    /**
     * This and all future requests should be directed to the given URI.
     */
    MOVED_PERMANENTLY = 301,

    /**
     * This is an example of industry practice contradicting the standard.
     * The HTTP/1.0 specification (RFC 1945) required the client to perform a temporary redirect
     * (the original describing phrase was "Moved Temporarily"), but popular browsers implemented 302
     * with the functionality of a 303 See Other. Therefore, HTTP/1.1 added status codes 303 and 307
     * to distinguish between the two behaviours. However, some Web applications and frameworks
     * use the 302 status code as if it were the 303.
     */
    FOUND = 302,

    /**
     * SINCE HTTP/1.1
     * The response to the request can be found under another URI using a GET method.
     * When received in response to a POST (or PUT/DELETE), the client should presume that
     * the server has received the data and should issue a redirect with a separate GET message.
     */
    SEE_OTHER = 303,

    /**
     * Indicates that the resource has not been modified since the version specified by the request headers If-Modified-Since or If-None-Match.
     * In such case, there is no need to retransmit the resource since the client still has a previously-downloaded copy.
     */
    NOT_MODIFIED = 304,

    /**
     * SINCE HTTP/1.1
     * The requested resource is available only through a proxy, the address for which is provided in the response.
     * Many HTTP clients (such as Mozilla and Internet Explorer) do not correctly handle responses with this status code, primarily for security reasons.
     */
    USE_PROXY = 305,

    /**
     * No longer used. Originally meant "Subsequent requests should use the specified proxy."
     */
    SWITCH_PROXY = 306,

    /**
     * SINCE HTTP/1.1
     * In this case, the request should be repeated with another URI; however, future requests should still use the original URI.
     * In contrast to how 302 was historically implemented, the request method is not allowed to be changed when reissuing the original request.
     * For example, a POST request should be repeated using another POST request.
     */
    TEMPORARY_REDIRECT = 307,

    /**
     * The request and all future requests should be repeated using another URI.
     * 307 and 308 parallel the behaviors of 302 and 301, but do not allow the HTTP method to change.
     * So, for example, submitting a form to a permanently redirected resource may continue smoothly.
     */
    PERMANENT_REDIRECT = 308,

    /**
     * The server cannot or will not process the request due to an apparent client error
     * (e.g., malformed request syntax, too large size, invalid request message framing, or deceptive request routing).
     */
    BAD_REQUEST = 400,

    /**
     * Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet
     * been provided. The response must include a WWW-Authenticate header field containing a challenge applicable to the
     * requested resource. See Basic access authentication and Digest access authentication. 401 semantically means
     * "unauthenticated",i.e. the user does not have the necessary credentials.
     */
    UNAUTHORIZED = 401,

    /**
     * Reserved for future use. The original intention was that this code might be used as part of some form of digital
     * cash or micro payment scheme, but that has not happened, and this code is not usually used.
     * Google Developers API uses this status if a particular developer has exceeded the daily limit on requests.
     */
    PAYMENT_REQUIRED = 402,

    /**
     * The request was valid, but the server is refusing action.
     * The user might not have the necessary permissions for a resource.
     */
    FORBIDDEN = 403,

    /**
     * The requested resource could not be found but may be available in the future.
     * Subsequent requests by the client are permissible.
     */
    NOT_FOUND = 404,

    /**
     * A request method is not supported for the requested resource;
     * for example, a GET request on a form that requires data to be presented via POST, or a PUT request on a read-only resource.
     */
    METHOD_NOT_ALLOWED = 405,

    /**
     * The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.
     */
    NOT_ACCEPTABLE = 406,

    /**
     * The client must first authenticate itself with the proxy.
     */
    PROXY_AUTHENTICATION_REQUIRED = 407,

    /**
     * The server timed out waiting for the request.
     * According to HTTP specifications:
     * "The client did not produce a request within the time that the server was prepared to wait. The client MAY repeat the request without modifications at any later time."
     */
    REQUEST_TIMEOUT = 408,

    /**
     * Indicates that the request could not be processed because of conflict in the request,
     * such as an edit conflict between multiple simultaneous updates.
     */
    CONFLICT = 409,

    /**
     * Indicates that the resource requested is no longer available and will not be available again.
     * This should be used when a resource has been intentionally removed and the resource should be purged.
     * Upon receiving a 410 status code, the client should not request the resource in the future.
     * Clients such as search engines should remove the resource from their indices.
     * Most use cases do not require clients and search engines to purge the resource, and a "404 Not Found" may be used instead.
     */
    GONE = 410,

    /**
     * The request did not specify the length of its content, which is required by the requested resource.
     */
    LENGTH_REQUIRED = 411,

    /**
     * The server does not meet one of the preconditions that the requester put on the request.
     */
    PRECONDITION_FAILED = 412,

    /**
     * The request is larger than the server is willing or able to process. Previously called "Request Entity Too Large".
     */
    PAYLOAD_TOO_LARGE = 413,

    /**
     * The URI provided was too long for the server to process. Often the result of too much data being encoded as a query-string of a GET request,
     * in which case it should be converted to a POST request.
     * Called "Request-URI Too Long" previously.
     */
    URI_TOO_LONG = 414,

    /**
     * The request entity has a media type which the server or resource does not support.
     * For example, the client uploads an image as image/svg+xml, but the server requires that images use a different format.
     */
    UNSUPPORTED_MEDIA_TYPE = 415,

    /**
     * The client has asked for a portion of the file (byte serving), but the server cannot supply that portion.
     * For example, if the client asked for a part of the file that lies beyond the end of the file.
     * Called "Requested Range Not Satisfiable" previously.
     */
    RANGE_NOT_SATISFIABLE = 416,

    /**
     * The server cannot meet the requirements of the Expect request-header field.
     */
    EXPECTATION_FAILED = 417,

    /**
     * This code was defined in 1998 as one of the traditional IETF April Fools' jokes, in RFC 2324, Hyper Text Coffee Pot Control Protocol,
     * and is not expected to be implemented by actual HTTP servers. The RFC specifies this code should be returned by
     * teapots requested to brew coffee. This HTTP status is used as an Easter egg in some websites, including Google.com.
     */
    I_AM_A_TEAPOT = 418,

    /**
     * The request was directed at a server that is not able to produce a response (for example because a connection reuse).
     */
    MISDIRECTED_REQUEST = 421,

    /**
     * The request was well-formed but was unable to be followed due to semantic errors.
     */
    UNPROCESSABLE_ENTITY = 422,

    /**
     * The resource that is being accessed is locked.
     */
    LOCKED = 423,

    /**
     * The request failed due to failure of a previous request (e.g., a PROPPATCH).
     */
    FAILED_DEPENDENCY = 424,

    /**
     * The client should switch to a different protocol such as TLS/1.0, given in the Upgrade header field.
     */
    UPGRADE_REQUIRED = 426,

    /**
     * The origin server requires the request to be conditional.
     * Intended to prevent "the 'lost update' problem, where a client
     * GETs a resource's state, modifies it, and PUTs it back to the server,
     * when meanwhile a third party has modified the state on the server, leading to a conflict."
     */
    PRECONDITION_REQUIRED = 428,

    /**
     * The user has sent too many requests in a given amount of time. Intended for use with rate-limiting schemes.
     */
    TOO_MANY_REQUESTS = 429,

    /**
     * The server is unwilling to process the request because either an individual header field,
     * or all the header fields collectively, are too large.
     */
    REQUEST_HEADER_FIELDS_TOO_LARGE = 431,

    /**
     * A server operator has received a legal demand to deny access to a resource or to a set of resources
     * that includes the requested resource. The code 451 was chosen as a reference to the novel Fahrenheit 451.
     */
    UNAVAILABLE_FOR_LEGAL_REASONS = 451,

    /**
     * A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.
     */
    INTERNAL_SERVER_ERROR = 500,

    /**
     * The server either does not recognize the request method, or it lacks the ability to fulfill the request.
     * Usually this implies future availability (e.g., a new feature of a web-service API).
     */
    NOT_IMPLEMENTED = 501,

    /**
     * The server was acting as a gateway or proxy and received an invalid response from the upstream server.
     */
    BAD_GATEWAY = 502,

    /**
     * The server is currently unavailable (because it is overloaded or down for maintenance).
     * Generally, this is a temporary state.
     */
    SERVICE_UNAVAILABLE = 503,

    /**
     * The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.
     */
    GATEWAY_TIMEOUT = 504,

    /**
     * The server does not support the HTTP protocol version used in the request
     */
    HTTP_VERSION_NOT_SUPPORTED = 505,

    /**
     * Transparent content negotiation for the request results in a circular reference.
     */
    VARIANT_ALSO_NEGOTIATES = 506,

    /**
     * The server is unable to store the representation needed to complete the request.
     */
    INSUFFICIENT_STORAGE = 507,

    /**
     * The server detected an infinite loop while processing the request.
     */
    LOOP_DETECTED = 508,

    /**
     * Further extensions to the request are required for the server to fulfill it.
     */
    NOT_EXTENDED = 510,

    /**
     * The client needs to authenticate to gain network access.
     * Intended for use by intercepting proxies used to control access to the network (e.g., "captive portals" used
     * to require agreement to Terms of Service before granting full Internet access via a Wi-Fi hotspot).
     */
    NETWORK_AUTHENTICATION_REQUIRED = 511,
  }
}
