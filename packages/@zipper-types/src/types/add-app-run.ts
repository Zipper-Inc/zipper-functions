import Zipper from '@zipper/framework';

export type AddAppRun = {
  appId: string;
  deploymentId: string;
  success: boolean;
  scheduleId?: string;
  rpcBody: Zipper.Relay.RequestBody;
  result: any;
};
