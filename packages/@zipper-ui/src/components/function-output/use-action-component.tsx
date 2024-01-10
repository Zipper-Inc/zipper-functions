import { useContext, useEffect, useState } from 'react';
import { parseRunUrlPath, getRunUrl } from '@zipper/utils';
import {
  FunctionOutputContext,
  FunctionOutputContextType,
} from './function-output-context';
import { InputParam, BootInfo, BootInfoResult } from '@zipper/types';
import { SmartFunctionOutputContext } from './smart-function-output-context';

export const findFileInParsedScripts = (
  filename?: string,
  parsedScripts?: BootInfo['parsedScripts'],
) => {
  if (!filename || !parsedScripts) return undefined;

  const entries = Object.entries(parsedScripts);
  const found = entries.find(
    ([key]) =>
      key === filename ||
      key.replace(/\.tsx?$/, '') === filename.replace(/\.tsx?$/, ''),
  );
  return found ? found[1] : undefined;
};

const getActionPath = (action: Zipper.ButtonAction | Zipper.DropdownAction) =>
  ((action as any)?.handler?.__handlerMeta?.path as string) || action.path;

export const useActionComponent = (
  action: Zipper.ButtonAction | Zipper.DropdownAction,
) => {
  const { showSecondaryOutput, applet, generateUserToken, bootInfoUrl } =
    useContext(FunctionOutputContext) as FunctionOutputContextType;

  const { outputSection } = useContext(SmartFunctionOutputContext);
  const inputsFromAction = action.inputs || {};

  const [bootInfo, setBootInfo] = useState<BootInfo>();

  useEffect(() => {
    getBootInfo();
  }, []);

  const getHeaders = async () => {
    const userToken = await generateUserToken();
    return {
      Authorization: `Bearer ${userToken || ''}`,
    };
  };

  const getBootInfo = async () => {
    if (bootInfo) return bootInfo;

    const bootInfoResult: BootInfoResult = await fetch(bootInfoUrl, {
      method: 'POST',
      body: '{}',
      headers: await getHeaders(),
    }).then((res) => res.json());

    if (bootInfoResult.ok) {
      setBootInfo(bootInfoResult.data);
      return bootInfoResult.data;
    }
  };

  const getInputsFromPath = async (): Promise<InputParam[]> => {
    const bootInfo = await getBootInfo();
    if (!bootInfo) return [];
    const { filename, action: actionFromPath } = parseRunUrlPath(action.path);
    const file = findFileInParsedScripts(filename, bootInfo.parsedScripts) || {
      inputs: [],
      actions: [],
    };

    return (
      (actionFromPath ? file.actions?.[actionFromPath]?.inputs : file.inputs) ||
      []
    );
  };

  const getScript = async () => {
    const inputs = await getInputsFromPath();
    const defaultValues = inputs.reduce((defaultValuesSoFar, { key, type }) => {
      const currentInput = inputs.find((i) => i.key === key);
      return currentInput
        ? {
            ...defaultValuesSoFar,
            [`${key}:${type}`]: currentInput.value,
          }
        : defaultValuesSoFar;
    }, {});

    showSecondaryOutput({
      actionShowAs: action.showAs,
      actionSection: outputSection,
      inputs: {
        inputParams: inputs.map((i) => {
          i.defaultValue = inputsFromAction[i.key];
          return i;
        }),
        defaultValues: defaultValues,
      },
      path: getActionPath(action),
    });
  };

  const runScript = async () => {
    const runPath = getActionPath(action);
    const inputs = await getInputsFromPath();

    const {
      version,
      filename,
      action: actionFromPath,
    } = parseRunUrlPath(runPath);
    const inputParamsWithValues = inputs.map((input: InputParam) => {
      input.value = inputsFromAction[input.key];
      return input;
    });

    const res = await fetch(
      getRunUrl({
        subdomain: '',
        version,
        filename,
        action: actionFromPath,
        isRelay: true,
      }).pathname,
      {
        method: 'POST',
        body: JSON.stringify(action.inputs),
        headers: await getHeaders(),
      },
    );

    const text = await res.text();

    if (action.showAs === 'refresh') {
      const originalInputs: Zipper.Inputs = {};

      const refreshPath =
        outputSection === 'main'
          ? applet?.mainContent.path
          : applet?.expandedContent.path;

      const { ...refreshPathProps } = parseRunUrlPath(refreshPath || '');

      const refreshInputParams =
        outputSection === 'main'
          ? applet?.mainContent.output?.inputsUsed || []
          : applet?.expandedContent.output?.inputsUsed || [];

      refreshInputParams.forEach((i) => (originalInputs[i.key] = i.value));

      const refreshRes = await fetch(
        getRunUrl({ ...refreshPathProps, subdomain: '', isRelay: true })
          .pathname,
        {
          method: 'POST',
          body: JSON.stringify(originalInputs),
          headers: await getHeaders(),
        },
      );

      const text = await refreshRes.text();

      showSecondaryOutput({
        actionShowAs: action.showAs,
        actionSection: outputSection,
        output: {
          data: text,
          inputsUsed: refreshInputParams,
        },
        path: refreshPath || 'main.ts',
      });
    } else {
      showSecondaryOutput({
        actionShowAs: action.showAs,
        actionSection: outputSection,
        output: {
          data: text,
          inputsUsed: inputParamsWithValues,
        },
        path: runPath || 'main.ts',
      });
    }
  };

  return { getScript, runScript };
};
