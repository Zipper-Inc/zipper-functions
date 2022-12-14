import '@fontsource/inter/variable-full.css';

import { ChakraProvider } from '@chakra-ui/react';
import Head from 'next/head';
import { ReactNode } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import { theme } from '~/theme';
import Header from './header';

type DefaultLayoutProps = { children: ReactNode; protected?: boolean };

export const BlankLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Zipper Functions</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ChakraProvider theme={theme}>
        <Header showNav={false} />
        <main>{children}</main>
      </ChakraProvider>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
};
