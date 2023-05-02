import { InputParam } from './input-params';

export interface InputParamWithValue extends InputParam {
  value?: string;
}

export type AppletPanel = {
  inputs?: InputParamWithValue[];
  output?: string;
  path: string;
  expandedInputs?: InputParamWithValue[];
  expandedOutput?: string;
  expandedPath?: string;
};

export type AppletReturnType = {
  inputs?: InputParamWithValue[];
  setInputs: (input: InputParamWithValue[] | undefined) => void;
  output?: string;
  setOutput: (output?: string) => void;
  path: string;
  setPath: (path: string) => void;
  expandedInputs?: InputParamWithValue[];
  setExpandedInputs: (input: InputParamWithValue[] | undefined) => void;
  expandedOutput?: string;
  setExpandedOutput: (output?: string) => void;
  expandedPath?: string;
  setExpandedPath: (path?: string) => void;
  addPanel: (path: string) => void;
  reset: () => void;
  isLoading: boolean;
  setIsLoading: (bool: boolean) => void;
  isExpandedLoading: boolean;
  setIsExpandedLoading: (bool: boolean) => void;
};
