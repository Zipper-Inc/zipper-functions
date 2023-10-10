import { createContext, useContext, useState } from 'react';

export const SmartFunctionOutputContext = createContext<{
  outputSection: 'main' | 'expanded';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  config?: Zipper.HandlerConfig;
}>({
  outputSection: 'main',
  searchQuery: '',
  setSearchQuery: () => {
    return;
  },
  config: undefined,
});

const SmartFunctionOutputProvider = ({
  children,
  outputSection,
  config,
}: {
  outputSection: 'main' | 'expanded';
  children: any;
  config?: Zipper.HandlerConfig;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <SmartFunctionOutputContext.Provider
      value={{
        outputSection,
        searchQuery,
        setSearchQuery,
        config,
      }}
    >
      {children}
    </SmartFunctionOutputContext.Provider>
  );
};

export const useSmartFunctionOutputContext = () =>
  useContext(SmartFunctionOutputContext);

export default SmartFunctionOutputProvider;
