import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@zipper/ui';

export default function Nextra({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
