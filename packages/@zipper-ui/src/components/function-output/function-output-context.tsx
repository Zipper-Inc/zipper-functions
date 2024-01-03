import {
  AppletContentReturnType,
  BootInfo,
  InputParams,
  ZipperLocation,
} from '@zipper/types';
import { createContext, useContext, useState } from 'react';

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
  bootInfoUrl: string;
  currentContext: 'main' | 'modal';
  appSlug: string;
  applet: AppletContentReturnType;
  modalApplet: AppletContentReturnType;
  zipperLocation?: ZipperLocation;
  generateUserToken: () => string | undefined | Promise<string | undefined>;
  getBootInfo: () => Promise<BootInfo>;
};

export const FunctionOutputContext = createContext<
  FunctionOutputContextType | undefined
>(undefined);

const FunctionOutputProvider = ({
  children,
  showSecondaryOutput,
  getRunUrl,
  bootInfoUrl,
  currentContext,
  appSlug,
  applet,
  modalApplet,
  generateUserToken,
}: Omit<FunctionOutputContextType, 'getBootInfo'> & { children: any }) => {
  const [bootInfo, setBootInfo] = useState<BootInfo>;

  return (
    <FunctionOutputContext.Provider
      value={{
        showSecondaryOutput,
        getRunUrl,
        bootInfoUrl,
        currentContext,
        appSlug,
        applet,
        modalApplet,
        generateUserToken,
        getBootInfo: async () => {
          const userToken = await generateUserToken();

          const headers = {
            Authorization: `Bearer ${userToken || ''}`,
          };

          const bootInfoResult: BootInfoResult = await fetch(bootInfoUrl, {
            method: 'POST',
            body: '{}',
            headers,
          }).then((res) => res.json());

          if (bootInfoResult.ok) {
            setBootInfo(bootInfoResult.data)
          }
          const bootInfo = (await bootInfoResult: BootInfoResult.json()) as BootInfoResult;
          if (bootInfo.ok) {
            const { inputs: fileInputs, actions } = bootInfo.data.parsedScripts[
              filename || 'main.ts'
            ] || {
              actions: [],
              fileInputs: [],
            };

            const inputs = actionFromPath
              ? actions[actionFromPath]
              : fileInputs;
            inputParamsWithValues =
              inputs?.map((input: InputParam) => {
                input.value = actionInputs[input.key];
                return input;
              }) || [];
          }
        },
      }}
    >
      {children}
    </FunctionOutputContext.Provider>
  );
};

export const useFunctionOutputContext = () => useContext(FunctionOutputContext);

export default FunctionOutputProvider;
