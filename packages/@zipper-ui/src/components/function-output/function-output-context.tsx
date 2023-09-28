import {
  AppletContentReturnType,
  InputParams,
  ZipperLocation,
} from '@zipper/types';
import { createContext, useContext } from 'react';

export type FunctionOutputContextType = {
  showSecondaryOutput: (args: {
    actionShowAs: Zipper.Action['showAs'];
    actionSection: 'expanded' | 'main';
    inputs?: {
      inputParams: InputParams;
      defaultValues: Record<string, any>;
    };
    output?: {
      data: string;
      inputsUsed: InputParams;
    };
    path: string;
  }) => void;
  getRunUrl: (scriptName: string) => string;
  appInfoUrl: string;
  currentContext: 'main' | 'modal';
  appSlug: string;
  applet: AppletContentReturnType;
  modalApplet: AppletContentReturnType;
  zipperLocation?: ZipperLocation;
  generateUserToken: () => string | undefined | Promise<string | undefined>;
};

export const FunctionOutputContext = createContext<
  FunctionOutputContextType | undefined
>(undefined);

const FunctionOutputProvider = ({
  children,
  showSecondaryOutput,
  getRunUrl,
  appInfoUrl,
  currentContext,
  appSlug,
  applet,
  modalApplet,
  generateUserToken,
}: FunctionOutputContextType & { children: any }) => {
  return (
    <FunctionOutputContext.Provider
      value={{
        showSecondaryOutput,
        getRunUrl,
        appInfoUrl,
        currentContext,
        appSlug,
        applet,
        modalApplet,
        generateUserToken,
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
