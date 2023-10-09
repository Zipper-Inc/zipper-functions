import { Box, LightMode } from '@chakra-ui/react';
import { ReactNode } from 'react';

export const Wrapper = ({ children }: { children: ReactNode }) => {
  // Force light mode on website stuff for now
  // @todo build out light mode?
  return (
    <LightMode>
      <Box
        w="full"
        as="main"
        m="0 auto"
        position="relative"
        bgGradient="linear(to-tl, #1789DC, #0766B7)"
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
          bgGradient="linear(to-r, #651D78, #9B2FB4)"
          zIndex={0}
        />
        {/* <Box
          position="absolute"
          left="0"
          top="0"
          w="0"
          h="0"
          borderBottom={{
            base: '600px solid transparent',
            lg: '1500px solid transparent',
          }}
          zIndex={0}
          borderLeft={{ base: '600px solid white', lg: '1500px solid white' }}
        /> */}
        <Box as="main" w="full" m="0 auto" zIndex={1} position="relative">
          {children}
        </Box>
      </Box>
    </LightMode>
  );
};
