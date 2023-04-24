import { FunctionOutputContextType } from './function-output-context';

export type FunctionOutputProps = {
  result: any;
  level?: number;
} & FunctionOutputContextType;

export interface RawOutputProps {
  result: any;
  level?: number;
}
