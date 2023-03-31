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

export type UserInfo = {
  emails: string[];
  userId?: string;
};

// same as RelayRequestBody in apps/zipper.run/src/utils/relay-middleware.ts
export type RequestBody = {
  error?: string;
  app: { id: string; slug: string };
  request: { method: string; url: string };
  inputs: Inputs;
  userInfo?: UserInfo;
  path?: string;
};

export type ZipperGlobal = {
  env: ReturnType<Deno.Env['toObject']>;
  storage: ZipperStorage;
  userInfo?: UserInfo;
  meta: {
    app: { id: string; slug: string };
    request: { method: string; url: string };
  };
};

declare global {
  interface Window {
    Zipper: ZipperGlobal;
  }
}
