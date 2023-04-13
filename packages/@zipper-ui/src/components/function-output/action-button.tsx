import { Button, Flex, Spinner } from '@chakra-ui/react';
import { useState } from 'react';
import { FunctionOutputProps } from './types';

export function ActionButton({
  action,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
}: Omit<FunctionOutputProps, 'result'> & { action: Zipper.Action }) {
  async function runScript() {
    const res = await fetch(getRunUrl(action.path), {
      method: 'POST',
      body: JSON.stringify(action.inputs || []),
      credentials: 'include',
    });
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
          await runScript();
          setIsLoading(false);
        }}
        mr={2}
      >
        {isLoading && <Spinner />}
        {!isLoading && (action.text || `Run ${action.path}`)}
      </Button>
    </Flex>
  );
}
