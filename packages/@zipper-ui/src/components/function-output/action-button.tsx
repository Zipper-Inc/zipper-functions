import { Button, Spinner } from '@chakra-ui/react';
import { useState } from 'react';
import { Action } from './action-component';
import { FunctionOutputProps } from './types';

export function ActionButton({
  action,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
}: Omit<FunctionOutputProps, 'result'> & { action: Action }) {
  async function runScript() {
    const res = await fetch(getRunUrl(action.script), {
      method: 'POST',
      body: JSON.stringify(action.inputs),
    });
    const text = await res.text();

    switch (action.showAs) {
      case 'modal':
        setModalResult({ heading: `${action.script}`, body: text });
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
    <Button
      colorScheme={'purple'}
      variant="outline"
      isDisabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        await runScript();
        setIsLoading(false);
      }}
    >
      {isLoading && <Spinner />}
      {!isLoading && (action.text || `Run ${action.script}`)}
    </Button>
  );
}
