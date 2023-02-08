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
