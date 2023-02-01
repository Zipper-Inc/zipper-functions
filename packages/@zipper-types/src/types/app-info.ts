import { InputParam } from './input-params';

export type AppInfo = {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  lastDeploymentVersion: string | null;
};

export type InputParams = InputParam[];

export type AppInfoAndInputParams = { app: AppInfo; inputs: InputParams };

export type AppInfoResult =
  | {
      ok: true;
      data: AppInfoAndInputParams;
    }
  | {
      ok: false;
      error: string;
    };
