import { JSX } from 'preact';
import { ChakraProvider, ChakraProviderProps } from '@chakra-ui/react';
import theme from './../../src/theme.ts';

const withChakraProvider =
  (providerProps: ChakraProviderProps) =>
  (InnerComponent: (props: any) => JSX.Element) =>
  (componentProps: any) =>
    (
      <ChakraProvider {...providerProps}>
        <InnerComponent {...componentProps} />
      </ChakraProvider>
    );

export default withChakraProvider;

export const withDefaultTheme = (InnerComponent: (props: any) => JSX.Element) =>
  withChakraProvider({ theme })(InnerComponent);
