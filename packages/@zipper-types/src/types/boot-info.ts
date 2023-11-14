import { InputParam } from './input-params';
import { UserAuthConnector } from './user-auth-connector';

export type AppInfo = {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  updatedAt: Date | null;
  isPrivate: boolean;
  requiresAuthToRun: boolean;
  organizationId: string | null;
  isDataSensitive: boolean;
  playgroundVersionHash: string | null;
  publishedVersionHash: string | null;
  editors: { userId: string; appId: string; isOwner: boolean }[];
  appAuthor?: {
    name: string;
    organization: string;
    image: string;
    orgImage: string;
  };
};

export type InputParams = InputParam[];

export type EntryPointInfo = {
  filename: string;
  editUrl: string;
};

export type BootInfo = {
  app: AppInfo;
  inputs: InputParams;
  parsedScripts: Record<string, Record<string, any>>;
  runnableScripts: string[];
  metadata?: Record<string, string | undefined>;
  entryPoint: EntryPointInfo;
};

export type BootInfoWithUser = BootInfo & {
  userInfo: Zipper.UserInfo;
  userAuthConnectors: UserAuthConnector[];
};

export type BootInfoResult<WithUser extends boolean = false> =
  | {
      ok: true;
      data: WithUser extends false ? BootInfo : BootInfoWithUser;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };
