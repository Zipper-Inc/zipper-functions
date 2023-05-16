import { FunctionOutputContextType } from './function-output-context';

export type FunctionOutputProps = {
  level?: number;
  handlerConfigs?: Record<string, Zipper.HandlerConfig>;
} & Omit<FunctionOutputContextType, 'showSecondaryOutput' | 'modalApplet'>;

export interface RawOutputProps {
  result: any;
  level?: number;
}
