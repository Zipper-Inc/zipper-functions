// * 🛑 DO NOT IMPORT ANYTHING INTO THIS FILE
// * It needs to be readable as is from the Monaco editor
// deno-lint-ignore-file no-explicit-any

/**
 * ✨
 * The global namespace where Zipper-specific, non-standard APIs are located.
 * ✨
 */
declare namespace Zipper {
  export type Primitive = string | number | boolean | null;
  export type PrimitiveKey = string | number;
  export type Serializable =
    | Primitive
    | Serializable[]
    | { [key: PrimitiveKey]: Serializable };

  export type InputParam = undefined | Serializable;
  export type Inputs = { [key: PrimitiveKey]: InputParam };
  export type Output = void | Serializable;
  export type Handler<I = Inputs> = (inputs?: I) => Output | Promise<Output>;

  export interface Storage {
    appId: string;
    get(key?: string): Promise<any>;
    set(key: string, value: unknown): Promise<any>;
    delete(key: string): Promise<any>;
  }

  export type UserInfo = {
    emails: string[];
    userId?: string;
  };

  export type AppInfo = {
    id: string;
    slug: string;
    version: string;
    url: string;
  };

  export type OriginalRequest = { method: string; url: string };

  /**
   * The namespace specific to the zipper.run <=> @zipper/framework middleware
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

  /**
   * An object containing useful environment variables
   *
   * @example const myEnvVariable = Zipper.env.MY_ENV_VARIABLE;
   */
  export const env: Record<string, string>;

  /**
   * Asynchronous storage solution for your apps
   *
   * @example
   * const allValues = await Zipper.storage.get();
   *
   * @example
   * const singleValue = await Zipper.storage.get('my-storage-key');
   *
   * @example
   * await Zipper.storage.set('another-storage-key', someStorageValue);
   *
   * @example
   * await Zipper.storage.delete('another-store-key');
   */
  export const storage: Storage;

  /**
   * Information about the user who called this app, blank if public
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
