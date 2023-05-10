import { Button, Flex, Spinner } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import {
  FunctionOutputContext,
  FunctionOutputContextType,
} from './function-output-context';
import { InputParam } from '@zipper/types';
import { SmartFunctionOutputContext } from './smart-function-output-context';
import Zipper from '../../../../@zipper-framework';

export function ActionButton({ action }: { action: Zipper.Action }) {
  const {
    showSecondaryOutput,
    getRunUrl,
    appInfoUrl,
    currentContext,
    applet,
    modalApplet,
  } = useContext(FunctionOutputContext) as FunctionOutputContextType;

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
    const currentApplet = currentContext === 'main' ? applet : modalApplet;

    const runPath = action.path;
    const inputs: Zipper.Inputs | undefined = action.inputs;

    const res = await fetch(getRunUrl(runPath || 'main.ts'), {
      method: 'POST',
      body: JSON.stringify(inputs || []),
      credentials: 'include',
    });
    const text = await res.text();

    if (action.showAs === 'refresh') {
      const existingInputs: Zipper.Inputs = {};

      const refreshPath =
        outputSection === 'main'
          ? currentApplet?.mainContent.path
          : currentApplet?.expandedContent.path;
      const refreshInputParams =
        outputSection === 'main'
          ? currentApplet?.mainContent.inputs
          : currentApplet?.expandedContent.inputs;

      refreshInputParams?.forEach((i) => (existingInputs[i.key] = i.value));

      console.log(refreshInputParams);
      console.log(existingInputs);

      const refreshRes = await fetch(getRunUrl(refreshPath || 'main.ts'), {
        method: 'POST',
        body: JSON.stringify(existingInputs || []),
        credentials: 'include',
      });
      const text = await refreshRes.text();

      showSecondaryOutput({
        actionShowAs: action.showAs,
        output: {
          result: text,
        },
        path: refreshPath || 'main.ts',
      });
    } else {
      showSecondaryOutput({
        actionShowAs: action.showAs,
        output: {
          result: text,
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
