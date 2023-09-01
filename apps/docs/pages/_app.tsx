import { ChakraProvider } from '@chakra-ui/react';
import { AppProps } from 'next/app';
import { theme } from '@zipper/ui';

function MyApp(props: AppProps) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chakra-ui-color-mode', localStorage.getItem('theme'));
  }

  return (
    <ChakraProvider theme={theme}>
      <props.Component {...props.pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
