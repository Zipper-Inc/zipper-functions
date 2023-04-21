import { createContext, useContext } from 'react';

type FunctionOutputContextType = {
  setExpandedResult: (result: any) => void;
  setModalResult: (result: any) => void;
  setOverallResult: (result: any) => void;
  getRunUrl: (scriptName: string) => string;
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
});

const FunctionOutputProvider = ({
  children,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
}: FunctionOutputContextType & { children: any }) => {
  return (
    <FunctionOutputContext.Provider
      value={{
        setExpandedResult,
        setModalResult,
        setOverallResult,
        getRunUrl,
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
