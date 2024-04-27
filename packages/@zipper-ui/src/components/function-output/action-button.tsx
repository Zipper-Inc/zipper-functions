'flex';
import { Button, Flex, Spinner } from '@chakra-ui/react';
import { useState } from 'react';
import { normalizeAppPath } from '@zipper/utils';
import { useActionComponent } from './use-action-component';

export function ActionButton({
  action,
}: {
  action: Zipper.ButtonAction & Zipper.ButtonComponentProps;
}) {
  const { getScript, runScript } = useActionComponent(action);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      colorScheme={action.colorScheme || 'purple'}
      w={action.width || 'fit-content'}
      variant={action.variant || 'outline'}
      isDisabled={isLoading || action.isDisabled}
      mr={2}
      onClick={async () => {
        setIsLoading(true);
        action.run
          ? await runScript().catch(console.error)
          : await getScript().catch(console.error);

        setIsLoading(false);
      }}
    >
      {isLoading && <Spinner />}
      {!isLoading && (action.text || `Run ${normalizeAppPath(action.path)}`)}
    </Button>
  );
}
