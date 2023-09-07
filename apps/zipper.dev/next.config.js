// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { env } = require('./src/server/env');
const { withSentryConfig } = require('@sentry/nextjs');

/**
 * Don't be scared of the generics here.
 * All they do is to give us autocompletion when using this.
 *
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function getConfig(config) {
  return withSentryConfig(
    config,
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options

      // Suppresses source map uploading logs during build
      silent: true,

      org: 'zipper-01',
      project: 'zipper-dot-dev',
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      transpileClientSDK: true,

      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
      tunnelRoute: '/monitoring',

      // Hides source maps from generated client bundles
      hideSourceMaps: true,

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
    },
  );
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
  experimental: {
    webpackBuildWorker: true,
    esmExternals: false,
  },
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  transpilePackages: [
    '@zipper/types',
    '@zipper/ui',
    '@zipper/utils',
    'monaco-languageclient',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
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
  // old url: https://similar-years-645746.framer.app (for rollbacks if necessary)
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/home',
      },
      {
        source: '/about',
        // destination: 'https://similar-years-645746.framer.app/about',
        destination: '/about',
      },
      {
        source: '/docs',
        destination: `${
          process.env.NODE_ENV === 'production'
            ? 'https://zipper-docs-production.onrender.com/docs'
            : 'http://localhost:3003/docs'
        }`,
      },
      {
        source: '/docs/:path*',
        destination: `${
          process.env.NODE_ENV === 'production'
            ? 'https://zipper-docs-production.onrender.com/docs/:path*'
            : 'http://localhost:3003/docs/:path*'
        }`,
      },
      // comment this back in when the blog is ready
      // {
      //   source: '/blog/:path*',
      //   destination: 'http://localhost:3004/blog/:path*',
      // },
      {
        source: '/run/:slug/:version/:filename/:path*',
        destination: `${
          process.env.NODE_ENV === 'production' ? 'https' : 'http'
        }://:slug.${
          process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST
        }/@:version/:filename/relay`,
      },
      {
        source: '/boot/:slug/:version/:path*',
        destination: `${
          process.env.NODE_ENV === 'production' ? 'https' : 'http'
        }://:slug.${
          process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST
        }/@:version/boot`,
      },
    ];
  },
});
