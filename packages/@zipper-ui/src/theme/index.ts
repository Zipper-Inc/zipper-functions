import { extendTheme, defineStyleConfig } from '@chakra-ui/react';
import multiSelectTheme from './multiSelectTheme';
import Gradient from 'javascript-color-gradient';
import { switchTheme } from './switch';

export const DARK_PURPLE = '#3C1053';
export const PURPLE = '#9B26B6';
export const ORANGE = '#F9423A';
export const BLUE = '#0072CE';
export const GRAY = '#F3F2F1';
export const DARK_GRAY = '#20252d';
export const LIGHT_GRAY = '#F9F8F8';
export const BLACK = '#000000';
export const WHITE = '#EEEEEE';

const VARIANTS = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const makeColorFromGradient = (
  baseColor: string | string[],
): { [v: number]: string } => {
  const spectrum = Array.isArray(baseColor)
    ? baseColor
    : [GRAY, baseColor, DARK_GRAY];

  const points = new Gradient()
    .setColorGradient(...spectrum)
    .setMidpoint(100)
    .getColors();

  const variants = VARIANTS.reduce((prev, value) => {
    return {
      ...prev,
      [value]: points[Math.floor(value / 10) - 1],
    };
  }, {});
  return variants;
};

/**
 * Chakra UI theme
 * @see https://chakra-ui.com/docs/styled-system/theme
 */

export const baseColors = {
  purple: makeColorFromGradient(PURPLE),
  darkPurple: makeColorFromGradient(DARK_PURPLE),
  orange: makeColorFromGradient(ORANGE),
  blue: makeColorFromGradient(BLUE),
  gray: makeColorFromGradient([GRAY, '#d4d3d2', DARK_GRAY, BLACK]),
  neutral: makeColorFromGradient([WHITE, GRAY, BLACK]),
  yellow: {
    25: '#FFFCF5',
    50: '#FFFAEB',
    100: '#FEF0C7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#7A2E0E',
  },
  green: {
    25: '#F6FEF9',
    50: '#ECFDF3',
    100: '#D1FADF',
    200: '#A6F4C5',
    300: '#6CE9A6',
    400: '#32D583',
    500: '#12B76A',
    600: '#039855',
    700: '#027A48',
    800: '#05603A',
    900: '#054F31',
  },
  indigo: {
    25: '#F5F8FF',
    50: '#EEF4FF',
    100: '#E0EAFF',
    200: '#C7D7FE',
    300: '#A4BCFD',
    400: '#8098F9',
    500: '#6172F3',
    600: '#444CE7',
    700: '#3538CD',
    800: '#2D31A6',
    900: '#2D3282',
  },
  pink: {
    25: '#FEF6FB',
    50: '#FDF2FA',
    100: '#FCE7F6',
    200: '#FCCEEE',
    300: '#FAA7E0',
    400: '#F670C7',
    500: '#EE46BC',
    600: '#DD2590',
    700: '#C11574',
    800: '#9E165F',
    900: '#851651',
  },
};

export const brandColors = {
  brandNeutral: GRAY,
  brandPurple: baseColors.purple[600],
  brandDarkPurple: baseColors.purple[800],
  brandBlue: baseColors.blue[600],
  brandOrange: baseColors.orange[600],
  default: baseColors.gray[600],
};

// no, not those kind of primary colors 🔵🔴🟡
export const primaryColors = {
  'primary.25': {
    default: baseColors.purple[25],
    _dark: baseColors.purple[900],
  },
  'primary.50': {
    default: baseColors.purple[50],
    _dark: baseColors.purple[800],
  },
  'primary.100': {
    default: baseColors.purple[100],
    _dark: baseColors.purple[700],
  },
  'primary.200': {
    default: baseColors.purple[200],
    _dark: baseColors.purple[600],
  },
  'primary.300': {
    default: baseColors.purple[300],
    _dark: baseColors.purple[500],
  },
  'primary.400': {
    default: baseColors.purple[400],
    _dark: baseColors.purple[400],
  },
  'primary.500': {
    default: baseColors.purple[500],
    _dark: baseColors.purple[300],
  },
  'primary.600': {
    default: baseColors.purple[600],
    _dark: baseColors.purple[200],
  },
  'primary.700': {
    default: baseColors.purple[700],
    _dark: baseColors.purple[100],
  },
  'primary.800': {
    default: baseColors.purple[800],
    _dark: baseColors.purple[50],
  },
  'primary.900': {
    default: baseColors.purple[900],
    _dark: baseColors.purple[25],
  },
  primary: {
    default: baseColors.purple[500],
    _dark: baseColors.purple[300],
  },
};

export const foregroundColors = {
  'fg.25': {
    default: 'gray.50',
    _dark: 'whiteAlpha.50',
  },
  'fg.50': {
    default: 'gray.50',
    _dark: 'whiteAlpha.50',
  },
  'fg.100': {
    default: 'gray.100',
    _dark: 'whiteAlpha.100',
  },
  'fg.200': {
    default: 'gray.200',
    _dark: 'whiteAlpha.200',
  },
  'fg.300': {
    default: 'gray.300',
    _dark: 'whiteAlpha.300',
  },
  'fg.400': {
    default: 'gray.400',
    _dark: 'whiteAlpha.400',
  },
  'fg.500': {
    default: 'gray.500',
    _dark: 'whiteAlpha.500',
  },
  'fg.600': {
    default: 'gray.600',
    _dark: 'whiteAlpha.600',
  },
  'fg.700': {
    default: 'gray.700',
    _dark: 'whiteAlpha.700',
  },
  'fg.800': {
    default: 'gray.800',
    _dark: 'whiteAlpha.800',
  },
  'fg.900': {
    default: 'gray.900',
    _dark: 'white',
  },
};

export const semanticTokens = {
  colors: {
    ...primaryColors,
    ...foregroundColors,
    fgText: foregroundColors['fg.800'],
    bgColor: {
      default: 'white',
      _dark: 'gray.800',
    },
  },
};

// 📐 Embrace the right angle
const borderRadius = {
  radii: {
    none: '0',
    sm: '0',
    base: '0',
    md: '0',
    lg: '0',
    xl: '0',
    '2xl': '0',
    '3xl': '0',
    full: '9999px',
  },
};
export const fonts = {
  body: '"InterVariable", sans-serif',
  heading: '"InterVariable", sans-serif',
  mono: 'Monaco, "Monaco", monospace',
};

export const theme = extendTheme({
  initialColorMode: 'system',
  components: {
    MultiSelect: multiSelectTheme,
    Switch: switchTheme,
  },
  styles: {
    global: {
      body: {
        height: '100vh',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      },
      '#__next': {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 'container.md',
      },
      // overrides some stuff in the AppConsole component
      '#app-console': {
        '[data-method]:first-of-type': {
          borderTop: 'none',
        },
        '[data-method]': {
          color: semanticTokens.colors.fgText.default,
          paddingY: '4px',
        },
        '[data-method]:not([data-method="warn"]):not([data-method="error"])': {
          borderColor: semanticTokens.colors['fg.200'].default,
        },
        '[data-method]:last-of-type': {
          borderBottom: 'none',
        },
        '[role="tree"]': {
          li: { paddingLeft: '8px', paddingRight: '8px' },
        },
      },
      '[data-theme="dark"]': {
        '#app-console': {
          '[data-method]': {
            color: semanticTokens.colors.fgText._dark,
          },
          '[data-method]:not([data-method="warn"]):not([data-method="error"])':
            {
              borderColor: semanticTokens.colors['fg.100']._dark,
            },
        },
      },
    },
  },
  colors: {
    ...brandColors,
    ...baseColors,
  },
  semanticTokens,
  fonts,
  ...borderRadius,
});
