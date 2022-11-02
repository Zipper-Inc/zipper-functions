export enum InputType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
  array = 'array',
  object = 'object',
  any = 'any',
}

export interface InputParam {
  key: string;
  type: InputType;
  optional: boolean;
}

export interface ParseInputResponse {
  ok: true;
  code: string;
  params: InputParam[];
}

export interface ParseInputError {
  ok: false;
  code: string;
  error: any;
}
