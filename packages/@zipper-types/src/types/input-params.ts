import { InputType } from './input-type';

export interface InputParam {
  key: string;
  type: InputType;
  optional: boolean;
  name?: string;
  description?: string;
  defaultValue?: string;
  value?: string;
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
