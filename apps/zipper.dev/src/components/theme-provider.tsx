'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import { useColorMode } from '@chakra-ui/react';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { colorMode } = useColorMode();

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={colorMode}
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
