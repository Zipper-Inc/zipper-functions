import { Flex, Spinner, Select, Button } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import { FunctionOutputContext } from './function-output-context';

export function ActionDropdown({ action }: { action: Zipper.Action }) {
  const {
    setModalResult,
    setExpandedResult,
    setOverallResult,
    getRunUrl,
    path,
    inputs,
  } = useContext(FunctionOutputContext);

  async function runScript(selectedValue: string) {
    const paramName = action.inputs?.name as string;

    const bodyData =
      action.showAs === 'refresh'
        ? inputs || []
        : paramName
        ? { [paramName]: selectedValue }
        : [];

    const body = JSON.stringify(bodyData);

    const res = await fetch(
      getRunUrl(action.showAs === 'refresh' ? path : action.path),
      {
        method: 'POST',
        body,
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
          await runScript(selectedValue ?? '').catch(console.error);
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
