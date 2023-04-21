// *
// * 🛑 DO NOT IMPORT ANYTHING INTO THIS FILE
// * It needs to be readable as is from the Monaco editor
// * Block comments in namespace will show up in editor
// *

// deno-lint-ignore-file no-explicit-any

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
  export type Primitive = string | number | boolean | null;

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
    | Primitive
    | Serializable[]
    | { [key: PrimitiveKey]: Serializable };

  /**
   * A single value inside an Inputs object
   * @category Handler Function
   * @see Inputs
   * @see Handler
   */
  export type InputParam = undefined | Serializable;

  /**
   * The inputs for a Handler function
   * It's passed as a single object with named parameters
   * @category Handler Function
   * @see Handler
   */
  export type Inputs = { [key: PrimitiveKey]: InputParam };

  /**
   * The output result of a Handler function
   * @category Handler Function
   * @see Handler
   */
  export type Output = void | Serializable;

  /**
   * A callable Handler function in Zipper's framework
   * Export a Handler function named `handler` to turn your file into a path
   * You may pass in a input definition for autogenerated UI
   * @category Handler Function
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
  export type Handler<I = Inputs> = (inputs?: I) => Output | Promise<Output>;

  /**
   * Actions
   */
  export interface Action<I = Inputs> {
    /**
     *
     */
    /**
     * The type of action this is
     */
    actionType: 'button';
    /**
     * The visible text for the Action
     */
    text?: string;
    /**
     * The path to the handler for this action
     */
    path: string;
    /**
     * Determines how we should show the input
     */
    showAs: 'modal' | 'expanded' | 'replace_all' | 'refresh';
    /**
     * The inputs to run the function with
     */
    inputs?: I;
  }

  export namespace Action {
    /**
     * Creates an action
     */
    export function create<I = Inputs>(action: Action<I>): Action<I>;
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
    userId?: string;
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
  };

  /**
   * Information about the original request
   * @category Runtime
   */
  export type OriginalRequest = { method: string; url: string };

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
      originalRequest: OriginalRequest;
      inputs: Inputs;
      userInfo?: UserInfo;
      path?: string;
    };
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

  /**
   * Information about the user who called this app
   * (blank if public)
   */
  export const userInfo: undefined | UserInfo;

  /**
   * Meta info about the app itself
   */
  export const appInfo: AppInfo;

  /**
   * Information about the original request
   */
  export const originalRequest: OriginalRequest;
}
