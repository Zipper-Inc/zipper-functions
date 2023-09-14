import { Flex, Spinner, Select, Button } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import {
  FunctionOutputContext,
  FunctionOutputContextType,
} from './function-output-context';
import { BootInfoResult, InputParam, InputParams } from '@zipper/types';
import { SmartFunctionOutputContext } from './smart-function-output-context';

export function ActionDropdown({ action }: { action: Zipper.DropdownAction }) {
  const {
    getRunUrl,
    showSecondaryOutput,
    appInfoUrl: bootInfoUrl,
    applet,
    generateUserToken,
  } = useContext(FunctionOutputContext) as FunctionOutputContextType;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>();
  const [inputs, setInputs] = useState<Zipper.Inputs | undefined>(
    action.inputs,
  );
  const [optionKey, setOptionKey] = useState<string>();
  useEffect(() => {
    setOptionKey(Object.keys(action.options)[0]);
  }, [action]);

  const { outputSection } = useContext(SmartFunctionOutputContext);

  async function getScript() {
    const actionInputs: Zipper.Inputs = inputs || {};
    const userToken = await generateUserToken();

    const headers = {
      Authorization: `Bearer ${userToken || ''}`,
    };

    const res = await fetch(bootInfoUrl, {
      method: 'POST',
      body: JSON.stringify({
        filename: action.path,
      }),
      headers,
    });
    const json = await res.json();

    const defaultValues: Record<string, any> = {};

    if (action.inputs) {
      Object.keys(action.inputs).forEach((k) => {
        const input = json.data.inputs.find((i: InputParam) => i.key == k);
        if (input) defaultValues[`${k}:${input.type}`] = actionInputs[k];
      });
    }

    showSecondaryOutput({
      actionShowAs: action.showAs,
      actionSection: outputSection,
      inputs: {
        inputParams: json.data.inputs.map((i: InputParam) => {
          if (action.inputs && actionInputs[i.key]) {
            i.defaultValue = actionInputs[i.key];
            return i;
          }
        }),
        defaultValues,
      },
      path: action.path,
    });
  }

  async function runScript() {
    const runPath = action.path;
    const userToken = await generateUserToken();
    const actionInputs: Zipper.Inputs = inputs || {};
    let inputParamsWithValues: InputParams = [];

    const headers = {
      Authorization: `Bearer ${userToken || ''}`,
    };

    const bootInfoRes = await fetch(bootInfoUrl, {
      method: 'POST',
      body: JSON.stringify({
        filename: action.path,
      }),
      headers,
    });

    const bootInfo = (await bootInfoRes.json()) as BootInfoResult;
    if (bootInfo.ok) {
      inputParamsWithValues = bootInfo.data.inputs.map((i) => {
        i.value = actionInputs[i.key];
        return i;
      });
    }

    const res = await fetch(getRunUrl(runPath || 'main.ts'), {
      method: 'POST',
      body: JSON.stringify(actionInputs),
      headers,
    });
    const text = await res.text();

    if (action.showAs === 'refresh') {
      const originalInputs: Zipper.Inputs = {};

      const refreshPath =
        outputSection === 'main'
          ? applet?.mainContent.path
          : applet?.expandedContent.path;
      const refreshInputParams =
        outputSection === 'main'
          ? applet?.mainContent.output?.inputsUsed || []
          : applet?.expandedContent.output?.inputsUsed || [];

      refreshInputParams.forEach((i) => (originalInputs[i.key] = i.value));

      const refreshRes = await fetch(getRunUrl(refreshPath || 'main.ts'), {
        method: 'POST',
        body: JSON.stringify(originalInputs),
        headers,
      });
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
  }

  return (
    <Flex justifyContent="end" mt="4">
      <Select
        isDisabled={isLoading}
        variant="outline"
        placeholder="Select option"
        value={selectedValue}
        onChange={(e) => {
          setSelectedValue(e.target.value);
          if (optionKey) {
            setInputs({
              ...action.inputs,
              [optionKey]: e.target.value || (action.inputs || {})[optionKey],
            });
          }
        }}
      >
        {optionKey &&
          action.options[optionKey]?.map((option, i) => {
            return (
              <option
                key={`${option.value}-${i}`}
                value={option.value?.toString()}
              >
                {option.label}
              </option>
            );
          })}
      </Select>

      <Button
        colorScheme={'purple'}
        variant="outline"
        isDisabled={isLoading}
        onClick={async () => {
          setIsLoading(true);
          action.run
            ? await runScript().catch(console.error)
            : await getScript().catch(console.error);
          setIsLoading(false);
        }}
        ml={2}
      >
        {isLoading && <Spinner />}
        {!isLoading && (action.text || `Run ${normalizeAppPath(action.path)}`)}
      </Button>
    </Flex>
  );
}
