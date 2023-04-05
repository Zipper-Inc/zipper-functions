import { InputParam } from './input-params';
import { UserAuthConnector } from './user-auth-connector';

export type AppInfo = {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  lastDeploymentVersion: string | null;
  updatedAt: Date | null;
  canUserEdit: boolean;
};

export type InputParams = InputParam[];

export type AppInfoAndInputParams = {
  app: AppInfo;
  userAuthConnectors: UserAuthConnector[];
  inputs: InputParams;
  userInfo: {
    emails: string[];
    userId?: string;
  };
  runnableScripts: string[];
};

export type AppInfoResult =
  | {
      ok: true;
      data: AppInfoAndInputParams;
    }
  | {
      ok: false;
      error: string;
    };
