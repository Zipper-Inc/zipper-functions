export function createUrlFromRelativeUrl(url = '/') {
  try {
    return new URL(url);
  } catch (e) {
    return new URL(url, 'protocol://host');
  }
}

export function getSearchParams(url?: string) {
  try {
    return createUrlFromRelativeUrl(url).searchParams;
  } catch (e) {
    return new URLSearchParams();
  }
}

export function getHost(url?: string) {
  try {
    return createUrlFromRelativeUrl(url).host;
  } catch (e) {
    return null;
  }
}

export function isLocalHost(
  host = process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST || '',
  env = process.env.NODE_ENV || 'development',
) {
  return (
    env === 'development' &&
    /^(localhost|127\.0\.0\.1|localdev\.me)/.test(host as string)
  );
}

export function getZipperDotDevUrl() {
  const protocol = isLocalHost() ? 'http' : 'https';
  return new URL(
    `${protocol}://${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST}`,
  );
}

export function getZipperApiUrl() {
  const url = getZipperDotDevUrl();
  url.pathname = '/api';
  return url;
}
