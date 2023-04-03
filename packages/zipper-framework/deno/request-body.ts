import { AppInfo, OriginalRequest, Inputs, UserInfo } from './types.ts';

export type RequestBody = {
  error?: string;
  appInfo: AppInfo;
  originalRequest: OriginalRequest;
  inputs: Inputs;
  userInfo?: UserInfo;
  path?: string;
};
