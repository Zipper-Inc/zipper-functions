import '@fontsource/inter';
import { ChakraProvider, Flex } from '@chakra-ui/react';
import Head from 'next/head';
import { ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { theme } from '@zipper/ui';

type DefaultLayoutProps = {
  children: ReactNode;
  protected?: boolean;
  header?: ReactNode;
  title?: string;
};

import { Global } from '@emotion/react';

const Fonts = () => (
  <Global
    styles={`
      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 300;
        src: url('/fonts/plaak/Plaak - 26-Ney-Light-205TF.otf') format('opentype');
      }

      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 400;
        src: url('/fonts/plaak/Plaak - 36-Ney-Regular-205TF.otf') format('opentype');
      }

      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 700;
        src: url('/fonts/plaak/Plaak - 46-Ney-Bold-205TF.otf') format('opentype');
      }

      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 900;
        src: url('/fonts/plaak/Plaak - 56-Ney-Heavy-205TF.otf') format('opentype');
      }
    `}
  />
);

export const DefaultLayout = ({ children, header }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Zipper</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ChakraProvider theme={theme}>
        <Fonts />
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
