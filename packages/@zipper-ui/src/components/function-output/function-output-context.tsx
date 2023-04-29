import { InputParams } from '@zipper/types';
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
  inputs?: Record<string, any>;
  path: string;
  currentContext: 'main' | 'modal' | 'expanded';
  appSlug: string;
};

export const FunctionOutputContext = createContext<FunctionOutputContextType>({
  showSecondaryOutput: () => {
    return;
  },
  getRunUrl: () => '',
  inputs: {},
  path: '',
  currentContext: 'main',
  appSlug: '',
});

const FunctionOutputProvider = ({
  children,
  showSecondaryOutput,
  getRunUrl,
  path,
  inputs,
  currentContext,
  appSlug,
}: FunctionOutputContextType & { children: any }) => {
  return (
    <FunctionOutputContext.Provider
      value={{
        showSecondaryOutput,
        getRunUrl,
        inputs,
        path,
        currentContext,
        appSlug,
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
