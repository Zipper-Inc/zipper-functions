import Zipper from '@zipper/framework';

export type AddAppRun = {
  id?: string;
  appId: string;
  deploymentId: string;
  success: boolean;
  scheduleId?: string;
  rpcBody: Zipper.Relay.RequestBody;
  result: any;
};
