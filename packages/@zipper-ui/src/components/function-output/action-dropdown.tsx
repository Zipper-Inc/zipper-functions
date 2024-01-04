import { Flex, Spinner, Select, Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import { useActionComponent } from './use-action-component';

export function ActionDropdown({ action }: { action: Zipper.DropdownAction }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>();
  const [inputs, setInputs] = useState<Zipper.Inputs | undefined>(
    action.inputs,
  );
  const { getScript, runScript } = useActionComponent({ ...action, inputs });
  const [optionKey, setOptionKey] = useState<string>();
  useEffect(() => {
    setOptionKey(Object.keys(action.options)[0]);
  }, [action]);

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
