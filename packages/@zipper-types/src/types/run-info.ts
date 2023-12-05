import { BootInfoWithUserInfo } from './boot-info';

export type RunInfo = BootInfoWithUserInfo & {
  appRun: {
    path: string;
    version: string;
    result: Zipper.Serializable;
    inputs: Record<string, string>;
  };
};

export type RunInfoResult =
  | {
      ok: true;
      data: RunInfo;
    }
  | {
      ok: false;
      error: string;
    };
