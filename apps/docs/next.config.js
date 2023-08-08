const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
});

module.exports = withNextra({
  reactStrictMode: true,
  transpilePackages: [
    '@zipper/framework',
    '@zipper/types',
    '@zipper/ui',
    '@zipper/utils',
  ],
});
