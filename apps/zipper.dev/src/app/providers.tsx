'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@zipper/ui';
import { extendTheme } from '@chakra-ui/react';
import localFont from 'next/font/local';
import { ThemeProvider } from '~/components/theme-provider';

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

const _theme = extendTheme({
  ...theme,
  fonts: {
    plaak: plaak.style.fontFamily,
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ChakraProvider theme={_theme}>{children}</ChakraProvider>
    </ThemeProvider>
  );
}
