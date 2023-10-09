import { FunctionOutputContextType } from './function-output-context';

export type FunctionOutputProps = {
  showTabs: boolean;
  runId?: string;
  reloadOnClose?: boolean;
  config?: Zipper.HandlerConfig;
} & Omit<FunctionOutputContextType, 'showSecondaryOutput' | 'modalApplet'>;

export interface RawOutputProps {
  result: any;
  level?: number;
}
