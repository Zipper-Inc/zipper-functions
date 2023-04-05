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

module.exports = getConfig({
  reactStrictMode: true,
  transpilePackages: [
    '@zipper/types',
    '@zipper/ui',
    '@zipper/utils',
    'zipper-framework',
  ],

  async rewrites() {
    return [
      {
        source: '/removeConnector/:appId/:connectorType/:path*',
        destination: `${
          process.env.NODE_ENV === 'production' ? 'https' : 'http'
        }://${
          process.env.NEXT_PUBLIC_ZIPPER_HOST
        }/api/app/:appId/removeConnector/:connectorType`,
      },
    ];
  },
});
