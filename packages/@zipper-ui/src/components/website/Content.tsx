import { VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';

export const WebSiteContent = ({ children }: { children: ReactNode }) => {
  return (
    <VStack as="main" gap={25} w="full" align="center">
      {children}
    </VStack>
  );
};
