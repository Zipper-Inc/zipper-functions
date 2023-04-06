// * 🛑 DO NOT IMPORT ANYTHING INTO THIS FILE
// * It needs to be readable as is from the Monaco editor

/**
 * The global Zipper namespace ✨
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
  type Output = void | Serializable;
  type Handler<I = Inputs> = (inputs?: I) => Output | Promise<Output>;

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
   * An object containing useful environment variables
   */
  export const env: Record<string, string>;

  /**
   * Asynchronous storage solution for your apps
   *  `storage.get` will get you the full storage, or single key if you pass a key
   *  `storage.set` will set a key to a given value
   *  `storage.delete` will delete a key
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
