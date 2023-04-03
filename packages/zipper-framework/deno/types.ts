/**
 * @todo ibu
 * These should be imported from `@zipper/types` somehow.
 * That way, we can share types across the apps and framework.
 * Not sure how to do that exactly with Deno/ESZip, since `@zipper/types` is Node 🤷🏽‍♂️
 */

/**
 * 🛑 DO NOT IMPORT INTO THIS FILE
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
