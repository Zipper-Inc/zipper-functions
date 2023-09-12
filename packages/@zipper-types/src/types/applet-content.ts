import { InputParams } from './boot-info';

export type AppletOutput = {
  inputsUsed: InputParams;
  data: string;
};

export type AppletContentPanel = {
  inputs?: InputParams;
  output?: AppletOutput;
  path?: string;
  expandedInputs?: InputParams;
  expandedOutput?: AppletOutput;
  expandedPath?: string;
};

export type AppletContentReturnType = {
  mainContent: {
    inputs?: InputParams;
    output?: AppletOutput;
    path?: string;
    isLoading: boolean;
    setIsLoading: (bool: boolean) => void;
    set: ({}: {
      path?: string;
      inputs?: InputParams;
      output?: AppletOutput;
    }) => void;
  };
  expandedContent: {
    inputs?: InputParams;
    output?: AppletOutput;
    path?: string;
    isLoading: boolean;
    setIsLoading: (bool: boolean) => void;
    set: ({}: {
      path?: string;
      inputs?: InputParams;
      output?: AppletOutput;
    }) => void;
  };
  addPanel: ({}: {
    mainContent: {
      path?: string;
      inputs?: InputParams;
      output?: AppletOutput;
    };
    expandedContent?: {
      path?: string;
      inputs?: InputParams;
      output?: AppletOutput;
    };
  }) => void;
  reset: () => void;
  goBack: () => void;
  showGoBackLink: () => boolean;
  panelStack: AppletContentPanel[];
  updatedAt: number;
};
