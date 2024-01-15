import {
  brand,
  neutral,
  primary,
  secondary,
  status,
  layout,
} from './src/tokens/colors';
import { animation, keyframes } from './src/tokens/animation';
import { fontFamily } from './src/tokens/fonts';

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/@zipper-ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    colors: {
      ...primary,
      ...secondary,
      ...neutral,
      ...brand,
      ...status,
      ...layout,
    },
    extend: {
      colors: {
        'primary-purple': genHslCollorPallet('primary-purple'),
        'primary-blue': genHslCollorPallet('primary-blue'),
        'primary-red': genHslCollorPallet('primary-red'),
        'secondary-gray': genHslCollorPallet('secondary-gray'),
        'secondary-blue': genHslCollorPallet('secondary-blue'),
        'secondary-purple': genHslCollorPallet('secondary-purple'),
        'secondary-pink': genHslCollorPallet('secondary-pink'),
        'secondary-green': genHslCollorPallet('secondary-green'),
        'secondary-yellow': genHslCollorPallet('secondary-yellow'),
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        success: 'hsl(var(--success))',
        success: 'hsl(var(---success))',
        error: 'hsl(var(---error))',
        warning: 'hsl(var(---warning))',
        destructive: 'hsl(var(---destructive))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--primary-red-600))',
          foreground: 'hsl(var(--foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      fontSize: {
        /** 0.625rem /* 10px /* line-height: 0.75rem /* 12px */
        xxs: [
          '0.625rem',
          {
            lineHeight: '0.75rem',
            letterSpacing: '-0.01em',
          },
        ],
      },
      keyframes,
      animation,
      fontFamily,
    },
  },
  plugins: [require('tailwindcss-animate')],
};

module.exports = config;
