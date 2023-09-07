import { Box } from '@chakra-ui/react';
import { ReactNode } from 'react';

export const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      w="full"
      as="main"
      m="0 auto"
      position="relative"
      bg="brandGray.100"
      overflowY="hidden"
      overflowX="hidden"
    >
      <Box
        position="absolute"
        left="0"
        top="0"
        w="0"
        h="0"
        borderBottom={{
          base: '600px solid transparent',
          lg: '1700px solid transparent',
        }}
        zIndex={0}
        borderLeft={{ base: '600px solid white', lg: '1700px solid white' }}
      />
      <Box as="main" w="full" m="0 auto" zIndex={1} position="relative">
        {children}
      </Box>
    </Box>
  );
};