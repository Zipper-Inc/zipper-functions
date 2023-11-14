import { BootInfoWithUser } from './boot-info';

export type RunInfo = BootInfoWithUser & {
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
