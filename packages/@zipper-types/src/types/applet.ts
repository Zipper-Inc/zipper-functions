import { InputParams } from './app-info';

export type AppletPanel = {
  inputs?: InputParams;
  output?: string;
  path: string;
  expandedInputs?: InputParams;
  expandedOutput?: string;
  expandedPath?: string;
};

export type AppletReturnType = {
  mainContent: {
    inputs?: InputParams;
    output?: string;
    path: string;
    isLoading: boolean;
    setIsLoading: (bool: boolean) => void;
    set: ({}: { path?: string; inputs?: InputParams; output?: string }) => void;
  };
  expandedContent: {
    inputs?: InputParams;
    output?: string;
    path?: string;
    isLoading: boolean;
    setIsLoading: (bool: boolean) => void;
    set: ({}: { path?: string; inputs?: InputParams; output?: string }) => void;
  };
  addPanel: ({}: {
    path: string;
    inputs?: InputParams;
    output?: string;
  }) => void;
  reset: () => void;
  goBack: () => void;
  numberOfPanels: () => number;
};
