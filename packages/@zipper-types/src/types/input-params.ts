import { InputType } from './input-type';
import { ParsedNode } from './parsed-types';

export type InputParam = {
  key: string;
  node: ParsedNode;
  optional: boolean;
  name?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  defaultValue?: Zipper.Serializable;
  value?: Zipper.Serializable;
};

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

export type InputParamDetail = {
  properties: {
    key: string;
    details: {
      type: InputType;
      // any additional details...
    };
  }[];
};
