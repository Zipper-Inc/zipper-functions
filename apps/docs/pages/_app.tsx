import { ChakraProvider } from '@chakra-ui/react';
import { AppProps } from 'next/app';

function MyApp(props: AppProps) {
  return (
    <ChakraProvider>
      <props.Component {...props.pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
