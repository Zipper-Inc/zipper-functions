/**
 * @todo ibu
 * These should be imported from `@zipper/types` somehow.
 * That way, we can share types across the apps and framework.
 * Not sure how to do that exactly with Deno/ESZip, since `@zipper/types` is Node 🤷🏽‍♂️
 */

// deno-lint-ignore-file no-explicit-any
import { type Storage } from './storage.ts';
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
  inputs: Inputs;
  userInfo?: UserInfo;
  path?: string;
};

export type ZipperGlobal = {
  env: ReturnType<Deno.Env['toObject']>;
  storage: Storage;
  userInfo?: UserInfo;
};

declare global {
  interface Window {
    Zipper: ZipperGlobal;
  }
}
