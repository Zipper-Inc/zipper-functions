import { Button, Flex, Link } from '@chakra-ui/react';
import Zipper from '../../../../@zipper-framework';

/** @todo handle internal links */
export function ActionLink({ action }: { action: Zipper.Action }) {
  return (
    <Flex justifyContent="end" mt="4">
      <Link
        href={action.path}
        target={(action as Zipper.LinkAction).target || '_self'}
      >
        <Button colorScheme={'purple'} variant="outline" mr={2}>
          {action.text || action.path}
        </Button>
      </Link>
    </Flex>
  );
}
