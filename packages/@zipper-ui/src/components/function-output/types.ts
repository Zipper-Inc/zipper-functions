export interface FunctionOutputProps {
  result: any;
  level?: number;
  setModalResult: (result: any) => void;
  setExpandedResult: (result: any) => void;
  setOverallResult: (result: any) => void;
}

export interface RawOutputProps {
  result: any;
  level?: number;
}
