export type RequestBody = {
  error?: string;
  appInfo: Zipper.AppInfo;
  originalRequest: Zipper.OriginalRequest;
  inputs: Zipper.Inputs;
  userInfo?: Zipper.UserInfo;
  path?: string;
};
