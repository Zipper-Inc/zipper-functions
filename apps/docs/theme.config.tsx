import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';
import { ZipperLogo } from '@zipper/ui';

const config: DocsThemeConfig = {
  logo: (
    <ZipperLogo
      fill="var(--chakra-colors-purple-700)"
      style={{ height: '20px' }}
    />
  ),
  primaryHue: { dark: 278, light: 280 },
  footer: {
    text: 'Zipper © 2023',
  },
};

export default config;
