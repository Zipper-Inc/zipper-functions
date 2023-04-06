/**
 * 🛑 DO NOT IMPORT ANYTHING INTO THIS FILE
 * It needs to be readable as is from the Monaco editor
 */

// deno-lint-ignore-file no-explicit-any

export type Inputs = Record<string, any>;
export type Output = any;
export type Handler = (inputs?: Inputs) => Output;
export type HandlerMap = {
  ['main.ts']: Handler;
  [filename: string]: Handler;
};

export declare class ZipperStorage {
  appId: string;
  constructor(appId: string);
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

declare global {
  /**
   * The Zipper global gives you access to env info, who called it, as well as basic storage
   */
  const Zipper: {
    /**
     * An object containing useful environment variables
     */
    env: Record<string, string>;
    /**
     * Asynchronous storage solution for your apps
     *  `storage.get` will get you the full storage, or single key if you pass a key
     *  `storage.set` will set a key to a given value
     *  `storage.delete` will delete a key
     */
    storage: ZipperStorage;
    /**
     * Information about the user who called this app, blank if public
     */
    userInfo?: UserInfo;
    /**
     * Meta info about the app itself
     */
    appInfo: AppInfo;
    /**
     * Information about the original request
     */
    originalRequest: OriginalRequest;
  };

  interface Window {
    Zipper: typeof Zipper;
  }
}
