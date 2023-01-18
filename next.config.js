// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { env } = require('./src/server/env');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

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
  transpilePackages: ['monaco-languageclient'],

  webpack: (config) => {
    config.plugins.push(
      new MonacoWebpackPlugin({
        languages: ['typescript'],
        filename: 'static/[name].worker.js',
      }),
    );
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/run/:path*',
        destination: `${process.env.RELAY_URL}/:path*`,
      },
      {
        source: '/api/__/parse-input',
        destination: `${process.env.PARSE_INPUT_URL}`,
      },
    ];
  },
});
