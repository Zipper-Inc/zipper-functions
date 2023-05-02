import { FunctionOutputContextType } from './function-output-context';

export type FunctionOutputProps = {
  level?: number;
} & Omit<FunctionOutputContextType, 'showSecondaryOutput' | 'modalApplet'>;

export interface RawOutputProps {
  result: any;
  level?: number;
}
