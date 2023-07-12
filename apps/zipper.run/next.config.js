/* eslint-disable prettier/prettier */
// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { withSentryConfig } = require('@sentry/nextjs');

const ZIPPER_DOT_DEV_PROTOCOL =
  process.env.NODE_ENV === 'development' &&
  /^localhost/.test(process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST || '')
    ? 'http'
    : 'https';
const ZIPPER_DOT_DEV_URL = `${ZIPPER_DOT_DEV_PROTOCOL}://${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST}`;

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
      project: 'zipper-dot-run',
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

module.exports = getConfig({
  reactStrictMode: true,
  transpilePackages: [
    '@zipper/framework',
    '@zipper/types',
    '@zipper/ui',
    '@zipper/utils',
  ],

  async rewrites() {
    return [
      {
        source: '/_zipper/removeConnector/:appId/:connectorType/:path*',
        destination: `${ZIPPER_DOT_DEV_URL}/api/app/:appId/removeConnector/:connectorType`,
      },
      {
        source: '/_zipper/app/info/:appSlug/:path*',
        destination: `${ZIPPER_DOT_DEV_URL}/api/app/info/:appSlug`,
      },
      {
        source: '/run/history/:runId.png',
        destination: '/api/runs/:runId/png',
      },
    ];
  },
});
