import { createContext, useContext } from 'react';

export type FunctionOutputContextType = {
  setExpandedResult: (result: any) => void;
  setModalResult: (result: any) => void;
  setOverallResult: (result: any) => void;
  getRunUrl: (scriptName: string) => string;
  inputs?: Record<string, any>;
  path: string;
  currentContext: 'main' | 'modal' | 'expanded';
};

export const FunctionOutputContext = createContext<FunctionOutputContextType>({
  setExpandedResult: () => {
    return;
  },
  setModalResult: () => {
    return;
  },
  setOverallResult: () => {
    return;
  },
  getRunUrl: () => '',
  inputs: {},
  path: '',
  currentContext: 'main',
});

const FunctionOutputProvider = ({
  children,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
  path,
  inputs,
  currentContext,
}: FunctionOutputContextType & { children: any }) => {
  return (
    <FunctionOutputContext.Provider
      value={{
        setExpandedResult,
        setModalResult,
        setOverallResult,
        getRunUrl,
        inputs,
        path,
        currentContext,
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
