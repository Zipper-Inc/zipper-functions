import { InputParam } from './input-params';
import { Connector, UserAuthConnector } from './user-auth-connector';

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
  editors: { userId: string; appId: string; isOwner: boolean }[];
  appAuthor?: {
    name: string;
    organization: string;
    image: string;
    orgImage: string;
  };
  canUserEdit?: boolean;
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
  connectors: Connector[];
  userInfo?: never;
  userAuthConnectors?: never;
};

export type UserInfoForBoot = {
  app: AppInfo & { canUserEdit: boolean };
  userInfo: Zipper.UserInfo;
  userAuthConnectors: UserAuthConnector[];
};

export type BootInfoWithUserInfo = Omit<
  BootInfo,
  'userInfo' | 'userAuthConnectors'
> &
  UserInfoForBoot;

export type BootInfoResult<WithUserInfo extends boolean = false> =
  | {
      ok: true;
      data: WithUserInfo extends false ? BootInfo : BootInfoWithUserInfo;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export type BootInfoWithUserResult = BootInfoResult<true>;
