import { createContext, useContext } from 'react';

type FunctionOutputContextType = {
  setExpandedResult: (result: any) => void;
  setModalResult: (result: any) => void;
  setOverallResult: (result: any) => void;
  getRunUrl: (scriptName: string) => string;
  inputs: Record<string, any>;
  path: string;
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
});

const FunctionOutputProvider = ({
  children,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
  path,
  inputs,
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
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
