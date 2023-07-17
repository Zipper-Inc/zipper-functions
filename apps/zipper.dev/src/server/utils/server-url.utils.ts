/*
 * Copy pasta from @zipper-utils/src/utils/url.ts
 * For some reason, we can't import @zipper-utils in server-only stuff
 */
function isLocalHost(
  host = process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST || '',
  env = process.env.NODE_ENV || 'development',
) {
  return (
    env === 'development' &&
    /^(localhost|127\.0\.0\.1|localdev\.me)/.test(host as string)
  );
}

export function getZipperDotDevUrlForServer() {
  const protocol = isLocalHost() ? 'http' : 'https';
  return new URL(
    `${protocol}://${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST}`,
  );
}
