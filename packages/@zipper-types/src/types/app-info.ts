import { InputParam } from './input-params';
import { UserAuthConnector } from './user-auth-connector';

export type AppInfo = {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  updatedAt: Date | null;
  canUserEdit: boolean;
  playgroundVersionHash: string | null;
  publishedVersionHash: string | null;
};

export type InputParams = InputParam[];

export type EntryPointInfo = {
  filename: string;
  editUrl: string;
};

export type AppInfoAndInputParams = {
  app: AppInfo;
  userAuthConnectors: UserAuthConnector[];
  inputs: InputParams;
  userInfo: {
    email?: string;
    userId?: string;
  };
  runnableScripts: string[];
  metadata?: Record<string, string | undefined>;
  entryPoint: EntryPointInfo;
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
