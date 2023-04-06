// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore <ignore-file-extension-for-node-compatibility>
import { AppInfo, OriginalRequest, Inputs, UserInfo } from './types.d.ts';

export type RequestBody = {
  error?: string;
  appInfo: AppInfo;
  originalRequest: OriginalRequest;
  inputs: Inputs;
  userInfo?: UserInfo;
  path?: string;
};
