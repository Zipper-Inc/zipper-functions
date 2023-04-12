import { AppInfoAndInputParams } from './app-info';

export type RunInfo = AppInfoAndInputParams & {
  appRun: {
    path: string;
    version: string;
    result: any;
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
