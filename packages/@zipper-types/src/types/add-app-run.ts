export type AddAppRun = {
  appId: string;
  deploymentId: string;
  success: boolean;
  scheduleId?: string;
  inputs?: Record<string, any>;
  result?: any;
};
