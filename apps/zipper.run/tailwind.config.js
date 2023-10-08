// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultConfig = require('@zipper/ui/tailwind.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...defaultConfig,
  content: [
    '../../packages/@zipper-ui/src/components/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,jsx,tsx}',
    './src/components/**/*.{ts,jsx,tsx}',
  ],
};
