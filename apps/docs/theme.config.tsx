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
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Zipper Documentation',
    };
  },
  head: (
    <>
      <meta property="og:title" content="%s – Zipper Documentation" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, viewport-fit=cover"
      />
      <meta name="msapplication-TileColor" content="#fff" />
      <meta http-equiv="Content-Language" content="en" />
      <meta
        name="description"
        content="Zipper turns Typescript functions into serverless web apps. UI, APIs, and auth all come standard."
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@zipperinc" />
      <meta
        property="og:title"
        content="Zipper: The simplest way to build web applications"
      />
      <meta
        property="og:description"
        content="Zipper turns Typescript functions into serverless web apps. UI, APIs, and auth all come standard."
      />
      <meta name="apple-mobile-web-app-title" content="Zipper" />
      <link rel="icon" href="/docs/favicon.svg" />
    </>
  ),
  editLink: {
    component: () => <></>,
  },
  feedback: {
    content: () => <></>,
  },
};

export default config;
