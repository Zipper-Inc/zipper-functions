import { ChakraProvider } from '@chakra-ui/react';
import { AppProps } from 'next/app';
import { theme } from '@zipper/ui';

function MyApp(props: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <props.Component {...props.pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
