import '@fontsource/inter';
import { ChakraProvider } from '@chakra-ui/react';
import Head from 'next/head';
import { ReactNode } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';

import { theme } from '@zipper/ui';

type DefaultLayoutProps = {
  children: ReactNode;
  protected?: boolean;
  header?: ReactNode;
  title?: string;
};

export const DefaultLayout = ({ children, header }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Zipper</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ChakraProvider theme={theme}>
        <>
          {header}
          <main>{children}</main>
        </>
      </ChakraProvider>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
};
