import { Button, Flex, Spinner } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import { FunctionOutputContext } from './function-output-context';
import { InputParam } from '@zipper/types';

export function ActionButton({ action }: { action: Zipper.Action }) {
  const {
    setModalResult,
    setExpandedResult,
    setOverallResult,
    getRunUrl,
    path,
    inputs,
    setModalInputs,
    appSlug,
  } = useContext(FunctionOutputContext);

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

    switch (action.showAs) {
      case 'modal':
        setModalInputs({
          inputParams: json.data.inputs,
          defaultValues,
          path: action.path,
        });
        break;
      default:
        break;
    }
  }

  async function runScript() {
    const res = await fetch(
      getRunUrl(action.showAs === 'refresh' ? path : action.path),
      {
        method: 'POST',
        body: JSON.stringify(
          action.showAs === 'refresh' ? inputs || [] : action.inputs || [],
        ),
        credentials: 'include',
      },
    );
    const text = await res.text();

    switch (action.showAs) {
      case 'modal':
        setModalResult({ heading: `${action.path}`, body: text });
        break;
      case 'expanded':
        setExpandedResult(text);
        break;
      case 'replace_all':
        setOverallResult(text);
        break;
      case 'refresh':
        setOverallResult(text);
        break;
      default:
        break;
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
