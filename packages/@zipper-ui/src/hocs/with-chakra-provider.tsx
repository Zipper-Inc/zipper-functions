import { ChakraProvider, ChakraProviderProps } from '@chakra-ui/react';
import { theme } from '../theme/theme';

export const withChakraProvider =
  (providerProps: ChakraProviderProps) =>
  (InnerComponent: (props: any) => JSX.Element) =>
  (componentProps: any) => (
    <ChakraProvider {...providerProps}>
      <InnerComponent {...componentProps} />
    </ChakraProvider>
  );

export const withDefaultTheme = (InnerComponent: (props: any) => JSX.Element) =>
  withChakraProvider({ theme })(InnerComponent);
