import { Flex, Spinner, Select, Button } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import {
  FunctionOutputContext,
  FunctionOutputContextType,
} from './function-output-context';
import { InputParam } from '@zipper/types';

export function ActionDropdown({ action }: { action: Zipper.Action }) {
  const {
    getRunUrl,
    showSecondaryOutput,
    appSlug,
    currentContext,
    applet,
    modalApplet,
  } = useContext(FunctionOutputContext) as FunctionOutputContextType;

  async function getScript() {
    const res = await fetch(`/api/app/info/${appSlug}`, {
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

  async function runScript(selectedValue: string) {
    const currentApplet = currentContext === 'main' ? applet : modalApplet;
    const runPath =
      action.showAs === 'refresh'
        ? currentApplet?.mainContent.path
        : action.path;

    const paramName = action.inputs?.paramName as string;

    const bodyData =
      action.showAs === 'refresh'
        ? currentApplet?.mainContent.inputs || []
        : paramName
        ? { [paramName]: selectedValue }
        : [];

    const body = JSON.stringify(bodyData);

    const res = await fetch(getRunUrl(runPath || 'main.ts'), {
      method: 'POST',
      body,
      credentials: 'include',
    });
    const text = await res.text();

    showSecondaryOutput({
      actionShowAs: action.showAs,
      output: {
        result: text,
      },
      path: action.path || currentApplet.mainContent.path || 'main.ts',
    });
  }

  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>();

  return (
    <Flex justifyContent="end" mt="4">
      <Select
        isDisabled={isLoading}
        variant="outline"
        placeholder="Select option"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
      >
        {action.inputs?.values &&
          Array.isArray(action.inputs.values) &&
          action.inputs.values.map((input: any) => {
            return (
              <option key={input.id} value={input.value}>
                {input.value}
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
            ? await runScript(selectedValue ?? '').catch(console.error)
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
