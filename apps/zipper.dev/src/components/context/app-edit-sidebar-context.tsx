import { noop } from '@tanstack/react-table';
import { createContext, useContext } from 'react';

export type AppEditSidebarContextType = {
  expandedResult: Record<string, any>;
  setExpandedResult: (expandedResult: Record<string, any>) => void;
  inputs: Record<string, any>;
  setInputs: (inputs: Record<string, any>) => void;
};

const AppEditSidebarContext = createContext<AppEditSidebarContextType>({
  expandedResult: {},
  setExpandedResult: noop,
  inputs: {},
  setInputs: noop,
});

export const AppEditSidebarProvider: React.FC<
  React.PropsWithChildren<{
    value: AppEditSidebarContextType;
  }>
> = ({ value, ...rest }) => {
  return <AppEditSidebarContext.Provider value={value} {...rest} />;
};

export const useAppEditSidebarContext = () => useContext(AppEditSidebarContext);
