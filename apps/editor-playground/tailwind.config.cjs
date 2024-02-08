import {
  brand,
  neutral,
  primary,
  secondary,
  status,
  layout,
} from './src/styles/tokens/colors';
import { animation, keyframes } from './src/styles/tokens/animation';
import { fontFamily } from './src/styles/tokens/fonts';

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
