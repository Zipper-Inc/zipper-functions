/**
 * @todo ibu
 * These should be imported from `@zipper/types` somehow.
 * That way, we can share types across the apps and framework.
 * Not sure how to do that exactly with Deno/ESZip, since `@zipper/types` is Node 🤷🏽‍♂️
 */

// deno-lint-ignore-file no-explicit-any
import { type ZipperStorage } from './storage.ts';
import { MAIN_PATH } from './constants.ts';

export type Inputs = Record<string, any>;
export type Output = any;
export type Handler = (inputs?: Inputs) => Output;
export type HandlerMap = {
  [MAIN_PATH]: Handler;
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

// same as RelayRequestBody in apps/zipper.run/src/utils/relay-middleware.ts
export type RequestBody = {
  error?: string;
  appInfo: AppInfo;
  originalRequest: OriginalRequest;
  inputs: Inputs;
  userInfo?: UserInfo;
  path?: string;
};

export type ZipperGlobal = {
  env: ReturnType<Deno.Env['toObject']>;
  storage: ZipperStorage;
  userInfo?: UserInfo;
  appInfo: AppInfo;
  originalRequest: OriginalRequest;
};

declare global {
  interface Window {
    Zipper: ZipperGlobal;
  }
}
