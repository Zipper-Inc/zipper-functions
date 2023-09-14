import { useColorMode } from '@chakra-ui/react';
import { AppProps } from 'next/app';
import { withDefaultTheme } from '@zipper/ui';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

function MyApp(props: AppProps) {
  const { setColorMode: setChakraColorMode } = useColorMode();
  const { theme: nextThemesTheme } = useTheme();

  // Make sure the `next-themes` tailwind docs theme is in sync with the rest of chakra stuff
  useEffect(() => {
    setChakraColorMode(nextThemesTheme);
  }, [nextThemesTheme]);

  return <props.Component {...props.pageProps} />;
}

export default withDefaultTheme(MyApp);
