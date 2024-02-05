'use client';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

const inter = Inter({ subsets: ['latin'] });

const plaak = localFont({
  src: [
    {
      path: '../../public/fonts/plaak/Plaak - 26-Ney-Light-205TF.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/plaak/Plaak - 36-Ney-Regular-205TF.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/plaak/Plaak - 46-Ney-Bold-205TF.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/plaak/Plaak - 56-Ney-Heavy-205TF.otf',
      weight: '900',
      style: 'normal',
    },
  ],
});

import {
  ChakraProps,
  ChakraProvider,
  extendTheme,
  Flex,
} from '@chakra-ui/react';
import Head from 'next/head';
import { ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { theme } from '@zipper/ui';
import { ThemeProvider } from './theme-provider';

const _theme = extendTheme({
  ...theme,
  fonts: {
    plaak: plaak.style.fontFamily,
  },
});

type DefaultLayoutProps = {
  children: ReactNode;
  protected?: boolean;
  header?: ReactNode;
  title?: string;
} & ChakraProps;

export const DefaultLayout = ({
  children,
  header,
  title,
  ...chakraProps
}: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>{title || 'Zipper'}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ChakraProvider theme={_theme}>
        <ThemeProvider>
          {/* <Fonts /> */}
          <>
            {header}
            <Flex
              as="main"
              flex={1}
              flexDirection="column"
              justifyContent="start"
              {...chakraProps}
            >
              {children}
            </Flex>
          </>
        </ThemeProvider>
      </ChakraProvider>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
};
