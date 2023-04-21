export interface FunctionOutputProps {
  result: any;
  level?: number;
  setModalResult: (result: any) => void;
  setExpandedResult: (result: any) => void;
  setOverallResult: (result: any) => void;
  getRunUrl: (scriptName: string) => string;
  path: string;
  inputs: Record<string, any>[];
}

export interface RawOutputProps {
  result: any;
  level?: number;
}
