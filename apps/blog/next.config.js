/* eslint-disable @typescript-eslint/no-var-requires */
const withNextra = require('nextra')({
  theme: './src/theme/index.tsx',
  themeConfig: './src/theme.config.tsx',
});

module.exports = withNextra({
  reactStrictMode: true,
  transpilePackages: [
    '@zipper/framework',
    '@zipper/types',
    '@zipper/ui',
    '@zipper/utils',
  ],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/blog',
        permanent: true,
      },
    ];
  },
});

// If you have other Next.js configurations, you can pass them as the parameter:
// module.exports = withNextra({ /* other next.js config */ })
