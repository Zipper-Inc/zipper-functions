import '@fontsource/inter';
import { ChakraProvider } from '@chakra-ui/react';
import Head from 'next/head';
import { ReactNode } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';

import { theme } from '~/theme';

type DefaultLayoutProps = { children: ReactNode; protected?: boolean };

export const NoHeaderLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Zipper Functions</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ChakraProvider theme={theme}>
        <main style={{ marginTop: '20px' }}>{children}</main>
      </ChakraProvider>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
};
