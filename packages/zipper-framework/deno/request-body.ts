import { AppInfo, OriginalRequest, Inputs, UserInfo } from './types.d.ts';

export type RequestBody = {
  error?: string;
  appInfo: AppInfo;
  originalRequest: OriginalRequest;
  inputs: Inputs;
  userInfo?: UserInfo;
  path?: string;
};
