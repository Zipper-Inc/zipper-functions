import { AppletContentReturnType, InputParams } from '@zipper/types';
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
  appInfoUrl: string;
  currentContext: 'main' | 'modal';
  appSlug: string;
  applet: AppletContentReturnType;
  modalApplet: AppletContentReturnType;
};

export const FunctionOutputContext = createContext<
  FunctionOutputContextType | undefined
>(undefined);

const FunctionOutputProvider = ({
  children,
  showSecondaryOutput,
  getRunUrl,
  appInfoUrl,
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
        appInfoUrl,
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
