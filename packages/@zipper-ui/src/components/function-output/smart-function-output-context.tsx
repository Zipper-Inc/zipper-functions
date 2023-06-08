import { createContext, useContext, useState } from 'react';

export const SmartFunctionOutputContext = createContext<{
  outputSection: 'main' | 'expanded';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}>({
  outputSection: 'main',
  searchQuery: '',
  setSearchQuery: () => {
    return;
  },
});

const SmartFunctionOutputProvider = ({
  children,
  outputSection,
}: {
  outputSection: 'main' | 'expanded';
  children: any;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <SmartFunctionOutputContext.Provider
      value={{
        outputSection,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </SmartFunctionOutputContext.Provider>
  );
};

export const useSmartFunctionOutputContext = () =>
  useContext(SmartFunctionOutputContext);

export default SmartFunctionOutputProvider;
