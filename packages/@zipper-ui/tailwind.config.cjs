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
      keyframes,
      animation,
      fontFamily,
    },
  },
  plugins: [require('tailwindcss-animate')],
};

module.exports = config;
