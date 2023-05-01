import '@fontsource/inter';
import { ChakraProvider, Flex } from '@chakra-ui/react';
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
          <Flex
            as="main"
            flex={1}
            flexDirection="column"
            justifyContent="start"
            alignItems="stretch"
          >
            {children}
          </Flex>
        </>
      </ChakraProvider>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
};
