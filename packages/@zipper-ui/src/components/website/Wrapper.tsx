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
        as="span"
        zIndex={0}
        w="full"
        h="2000px"
        position="absolute"
        top={0}
        right={'15%'}
      >
        <svg
          width="2000"
          height="2000"
          viewBox="0 0 1401 1408"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M-274.352 1408L1401 0H-786V1408H-274.352Z" fill="white" />
        </svg>
      </Box>
      <Box as="main" w="full" m="0 auto" zIndex={1} position="relative">
        {children}
      </Box>
    </Box>
  );
};
