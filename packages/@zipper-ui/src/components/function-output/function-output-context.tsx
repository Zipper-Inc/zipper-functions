import { InputParams } from '@zipper/types';
import { createContext, useContext } from 'react';

export type FunctionOutputContextType = {
  setExpandedResult: (result: any) => void;
  setModalResult: (result: any) => void;
  setModalInputs: ({}: {
    inputParams: InputParams;
    defaultValues: Zipper.Inputs;
    path: string;
  }) => void;
  setOverallResult: (result: any) => void;
  getRunUrl: (scriptName: string) => string;
  inputs?: Record<string, any>;
  path: string;
  currentContext: 'main' | 'modal' | 'expanded';
  appSlug: string;
};

export const FunctionOutputContext = createContext<FunctionOutputContextType>({
  setExpandedResult: () => {
    return;
  },
  setModalResult: () => {
    return;
  },
  setModalInputs: () => {
    return;
  },
  setOverallResult: () => {
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
  setExpandedResult,
  setModalResult,
  setModalInputs,
  setOverallResult,
  getRunUrl,
  path,
  inputs,
  currentContext,
  appSlug,
}: FunctionOutputContextType & { children: any }) => {
  return (
    <FunctionOutputContext.Provider
      value={{
        setExpandedResult,
        setModalResult,
        setModalInputs,
        setOverallResult,
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
