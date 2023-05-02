import { InputParam } from './input-params';

export interface InputParamWithValue extends InputParam {
  value?: string;
}

export type AppletPanel = {
  inputs?: InputParamWithValue[];
  output?: Record<string, string>;
  expandedInputs?: InputParamWithValue[];
  expandedOutput?: Record<string, string>;
  path?: string;
};

export type AppletReturnType = {
  inputs?: InputParamWithValue[];
  setInputs: (input: InputParamWithValue[] | undefined) => void;
  output?: Record<string, any>;
  setOutput: (output: Record<string, string> | undefined) => void;
  expandedInputs?: InputParamWithValue[];
  setExpandedInputs: (input: InputParamWithValue[] | undefined) => void;
  expandedOutput?: Record<string, any>;
  setExpandedOutput: (output: Record<string, string> | undefined) => void;
  path?: string;
  setPath: (path: string) => void;
  addPanel: () => void;
};
