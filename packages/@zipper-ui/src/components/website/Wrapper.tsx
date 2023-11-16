import { Box, LightMode } from '@chakra-ui/react';
import { ReactNode } from 'react';

export const Wrapper = ({
  children,
  mode = 'light',
}: {
  children: ReactNode;
  mode?: 'dark' | 'light';
}) => {
  // Force light mode on website stuff for now
  // @todo build out light mode?
  return (
    <LightMode>
      <Box
        w="full"
        as="main"
        m="0 auto"
        position="relative"
        bg={
          mode === 'light'
            ? 'gray.100'
            : 'linear-gradient(to top left, #1789DC, #0766B7)'
        }
        overflowY="hidden"
        overflowX="hidden"
      >
        <Box
          position="absolute"
          left="0"
          top="0"
          w="1800px"
          h="1800px"
          clipPath="polygon(0% 0%, 100% 0%, 0% 100%)"
          bg={
            mode === 'light'
              ? 'white'
              : 'linear-gradient(to right, #651D78, #9B2FB4)'
          }
          zIndex={0}
        />
        <Box as="main" w="full" m="0 auto" zIndex={1} position="relative">
          {children}
        </Box>
      </Box>
    </LightMode>
  );
};
