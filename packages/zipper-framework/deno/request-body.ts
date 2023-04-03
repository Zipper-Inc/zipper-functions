import { AppInfo, OriginalRequest, Inputs, UserInfo } from './types.ts';

// same as RelayRequestBody in apps/zipper.run/src/utils/relay-middleware.ts

export type RequestBody = {
  error?: string;
  appInfo: AppInfo;
  originalRequest: OriginalRequest;
  inputs: Inputs;
  userInfo?: UserInfo;
  path?: string;
};
