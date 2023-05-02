import { AppletReturnType, InputParams } from '@zipper/types';
import { createContext, useContext } from 'react';

export type FunctionOutputContextType = {
  showSecondaryOutput: (args: {
    currentContext: 'main' | 'modal' | 'expanded';
    actionShowAs: Zipper.Action['showAs'];
    inputs?: {
      inputParams: InputParams;
      defaultValues: Record<string, any>;
      path: string;
    };
    output?: {
      result: any;
      path: string;
    };
  }) => void;
  getRunUrl: (scriptName: string) => string;
  currentContext: 'main' | 'modal';
  appSlug: string;
  applet?: AppletReturnType;
};

export const FunctionOutputContext = createContext<FunctionOutputContextType>({
  showSecondaryOutput: () => {
    return;
  },
  getRunUrl: () => '',
  currentContext: 'main',
  appSlug: '',
  applet: undefined,
});

const FunctionOutputProvider = ({
  children,
  showSecondaryOutput,
  getRunUrl,
  currentContext,
  appSlug,
  applet,
}: FunctionOutputContextType & { children: any }) => {
  return (
    <FunctionOutputContext.Provider
      value={{
        showSecondaryOutput,
        getRunUrl,
        currentContext,
        appSlug,
        applet,
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
