import { switchAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(switchAnatomy.keys);

const bauhaus = definePartsStyle({
  container: {
    display: 'flex',
    align: 'center',
  },
  track: {
    borderRadius: '2px',
    height: 'calc(var(--switch-track-height) / 2)',
    p: 0,
    alignItems: 'center',
  },
  thumb: {
    borderRadius: 'full',
    border: 'solid',
    height: 'calc(var(--switch-track-height) + 2px)',
    width: 'calc(var(--switch-track-height) + 2px)',
    borderWidth: 2,
    borderColor: 'var(--switch-bg)',
  },
});

export const switchTheme = defineMultiStyleConfig({
  variants: { bauhaus },
  defaultProps: {
    variant: 'bauhaus',
  },
});
