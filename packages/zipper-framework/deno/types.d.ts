/**
 * 🛑 DO NOT IMPORT ANYTHING INTO THIS FILE
 * It needs to be readable as is from the Monaco editor
 */

// deno-lint-ignore-file no-explicit-any
export declare class ZipperStorage {
  appId: string;
  constructor(appId: string);
  get(key?: string): Promise<any>;
  set(key: string, value: unknown): Promise<any>;
  delete(key: string): Promise<any>;
}

export type Inputs = Record<string, any>;
export type Output = any;
export type Handler = (inputs?: Inputs) => Output;
export type HandlerMap = {
  ['main.ts']: Handler;
  [filename: string]: Handler;
};

export type AppInfo = {
  id: string;
  slug: string;
  version: string;
  url: string;
};
export type UserInfo = {
  emails: string[];
  userId?: string;
};

export type OriginalRequest = { method: string; url: string };

export type ZipperGlobal = {
  env: Record<string, string>;
  storage: ZipperStorage;
  userInfo?: UserInfo;
  appInfo: AppInfo;
  originalRequest: OriginalRequest;
};

declare global {
  // Because it gets imported into the `app.ts` which assigns window.*
  // The editor gets a little confused and thinks this is an error
  //
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: <see-above>
  const Zipper: ZipperGlobal;
  interface Window {
    Zipper: ZipperGlobal;
  }
}
