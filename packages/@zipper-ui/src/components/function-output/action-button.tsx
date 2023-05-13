import { Button, Flex, Spinner } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import {
  FunctionOutputContext,
  FunctionOutputContextType,
} from './function-output-context';
import { AppInfoResult, InputParam, InputParams } from '@zipper/types';
import { SmartFunctionOutputContext } from './smart-function-output-context';
import Zipper from '../../../../@zipper-framework';

export function ActionButton({ action }: { action: Zipper.Action }) {
  const { showSecondaryOutput, getRunUrl, appInfoUrl, applet } = useContext(
    FunctionOutputContext,
  ) as FunctionOutputContextType;

  const { outputSection } = useContext(SmartFunctionOutputContext);

  async function getScript() {
    const res = await fetch(appInfoUrl, {
      method: 'POST',
      body: JSON.stringify({
        filename: action.path,
      }),
      credentials: 'include',
    });

    const json = await res.json();

    const defaultValues: Record<string, any> = {};

    if (action.inputs) {
      Object.keys(action.inputs).forEach((k) => {
        const input = json.data.inputs.find((i: InputParam) => i.key == k);
        if (input) defaultValues[`${k}:${input.type}`] = action.inputs![k];
      });
    }

    showSecondaryOutput({
      actionShowAs: action.showAs,
      actionSection: outputSection,
      inputs: {
        inputParams: json.data.inputs.map((i: InputParam) => {
          i.defaultValue = action.inputs![i.key];
          return i;
        }),
        defaultValues,
      },
      path: action.path!,
    });
  }

  async function runScript() {
    const runPath = action.path;
    const actionInputs: Zipper.Inputs = action.inputs || {};
    let inputParamsWithValues: InputParams = [];

    const appInfoRes = await fetch(appInfoUrl, {
      method: 'POST',
      body: JSON.stringify({
        filename: action.path,
      }),
      credentials: 'include',
    });

    const appInfo = (await appInfoRes.json()) as AppInfoResult;
    if (appInfo.ok) {
      inputParamsWithValues = appInfo.data.inputs.map((i) => {
        i.value = actionInputs[i.key];
        return i;
      });
    }

    const res = await fetch(getRunUrl(runPath || 'main.ts'), {
      method: 'POST',
      body: JSON.stringify(actionInputs),
      credentials: 'include',
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
        credentials: 'include',
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

  const [isLoading, setIsLoading] = useState(false);

  return (
    <Flex justifyContent="end" mt="4">
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
        mr={2}
      >
        {isLoading && <Spinner />}
        {!isLoading && (action.text || `Run ${normalizeAppPath(action.path)}`)}
      </Button>
    </Flex>
  );
}
