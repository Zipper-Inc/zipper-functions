import { createContext, useContext } from 'react';

export const SmartFunctionOutputContext = createContext<{
  outputSection: 'main' | 'expanded';
}>({ outputSection: 'main' });

const SmartFunctionOutputProvider = ({
  children,
  outputSection,
}: {
  outputSection: 'main' | 'expanded';
  children: any;
}) => {
  return (
    <SmartFunctionOutputContext.Provider
      value={{
        outputSection,
      }}
    >
      {children}
    </SmartFunctionOutputContext.Provider>
  );
};

export const useSmartFunctionOutputContext = () =>
  useContext(SmartFunctionOutputContext);

export default SmartFunctionOutputProvider;
