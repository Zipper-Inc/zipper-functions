// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { env } = require('./src/server/env');

/**
 * Don't be scared of the generics here.
 * All they do is to give us autocompletion when using this.
 *
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function getConfig(config) {
  return config;
}

/**
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
module.exports = getConfig({
  /**
   * Dynamic configuration available for the browser and server.
   * Note: requires `ssr: true` or a `getInitialProps` in `_app.tsx`
   * @link https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration
   */
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  transpilePackages: [
    '@zipper/types',
    '@zipper/ui',
    '@zipper/utils',
    'monaco-languageclient',
    'nanoid',
  ],
  webpack: (config) => {
    if (!config.module.noParse)
      config.module.noParse = [
        require.resolve('@ts-morph/common/dist/typescript.js'),
      ];
    else
      config.module.noParse.push(
        require.resolve('@ts-morph/common/dist/typescript.js'),
      );
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/run/:slug/:version/:filename/:path*',
        destination: `${process.env.NODE_ENV === 'production' ? 'https' : 'http'
          }://:slug.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
          }/@:version/:filename/call`,
      },
    ];
  },
});
