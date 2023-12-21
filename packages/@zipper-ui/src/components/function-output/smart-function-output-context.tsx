import { ZipperLocation } from '@zipper/types';
import { createContext, useContext, useState } from 'react';

export const SmartFunctionOutputContext = createContext<{
  outputSection: 'main' | 'expanded';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  config: Zipper.HandlerConfig;
  location: ZipperLocation;
  runHistoryUrl?: string;
}>({
  outputSection: 'main',
  searchQuery: '',
  setSearchQuery: () => {
    return;
  },
  config: {},
  location: ZipperLocation.ZipperDotRun,
});

const SmartFunctionOutputProvider = ({
  children,
  outputSection,
  config,
  location = ZipperLocation.ZipperDotRun,
  runHistoryUrl,
}: {
  outputSection: 'main' | 'expanded';
  children: any;
  config: Zipper.HandlerConfig;
  location?: ZipperLocation;
  runHistoryUrl?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <SmartFunctionOutputContext.Provider
      value={{
        outputSection,
        searchQuery,
        setSearchQuery,
        config,
        location,
        runHistoryUrl,
      }}
    >
      {children}
    </SmartFunctionOutputContext.Provider>
  );
};

export const useSmartFunctionOutputContext = () =>
  useContext(SmartFunctionOutputContext);

export default SmartFunctionOutputProvider;
