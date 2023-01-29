export type AppInfo = {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  lastDeploymentVersion: string | null;
};

export enum InputType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
  array = 'array',
  object = 'object',
  any = 'any',
}

export type InputParam = {
  key: string;
  type: InputType;
  optional: boolean;
};

export const JSONEditorInputTypes = [
  InputType.array,
  InputType.object,
  InputType.any,
];

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
