import { AppletReturnType, InputParams } from '@zipper/types';
import { createContext, useContext } from 'react';

export type FunctionOutputContextType = {
  showSecondaryOutput: (args: {
    actionShowAs: Zipper.Action['showAs'];
    inputs?: {
      inputParams: InputParams;
      defaultValues: Record<string, any>;
    };
    output?: {
      result: string;
    };
    path: string;
  }) => void;
  getRunUrl: (scriptName: string) => string;
  currentContext: 'main' | 'modal';
  appSlug: string;
  applet: AppletReturnType;
  modalApplet: AppletReturnType;
};

export const FunctionOutputContext = createContext<FunctionOutputContextType>({
  showSecondaryOutput: () => {
    return;
  },
  getRunUrl: () => '',
  currentContext: 'main',
  appSlug: '',
  applet: {
    setInputs: () => {
      return;
    },
    setOutput: () => {
      return;
    },
    setExpandedInputs: () => {
      return;
    },
    setExpandedOutput: () => {
      return;
    },
    setPath: () => {
      return;
    },
    addPanel: () => {
      return;
    },
    path: '',
  },
  modalApplet: {
    setInputs: () => {
      return;
    },
    setOutput: () => {
      return;
    },
    setExpandedInputs: () => {
      return;
    },
    setExpandedOutput: () => {
      return;
    },
    setPath: () => {
      return;
    },
    addPanel: () => {
      return;
    },
    path: '',
  },
});

const FunctionOutputProvider = ({
  children,
  showSecondaryOutput,
  getRunUrl,
  currentContext,
  appSlug,
  applet,
  modalApplet,
}: FunctionOutputContextType & { children: any }) => {
  return (
    <FunctionOutputContext.Provider
      value={{
        showSecondaryOutput,
        getRunUrl,
        currentContext,
        appSlug,
        applet,
        modalApplet,
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
