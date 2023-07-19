import { useColorMode, Button } from '@chakra-ui/react';
import { useMounted } from 'nextra/hooks';
import { MoonIcon, SunIcon } from 'nextra/icons';

export default function ThemeSwitch() {
  const { toggleColorMode, colorMode } = useColorMode();
  const mounted = useMounted();
  const isDark = colorMode === 'dark';

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
