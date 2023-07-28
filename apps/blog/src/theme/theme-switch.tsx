import { useColorMode, Button } from '@chakra-ui/react';
import { useTheme } from 'next-themes';
import { useMounted } from 'nextra/hooks';
import { MoonIcon, SunIcon } from 'nextra/icons';
import { useEffect } from 'react';

export default function ThemeSwitch() {
  const { toggleColorMode, colorMode } = useColorMode();
  const { setTheme, theme } = useTheme();
  const mounted = useMounted();
  const isDark = colorMode === 'dark';

  // make sure to set the next theme so that the nextra components follow suit
  useEffect(() => {
    console.log('effect', colorMode, theme);
    setTheme(colorMode);
  }, [colorMode]);

  return (
    <Button
      colorScheme="purple"
      aria-label="Toggle Dark Mode"
      tabIndex={0}
      onClick={toggleColorMode}
      onKeyDown={(e) => {
        if (e.key === 'Enter') toggleColorMode();
      }}
    >
      {mounted && isDark ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}
