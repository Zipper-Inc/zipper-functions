export const VERSION_DELIMETER = '@';

/**
 * Matches the first part of the URL path to see if we've passed a version
 * @example https://my-app-name.zipper.run/@fooversion => fooversion
 */
export default function getVersionFromUrl(url: string): string | void {
  // new URL will throw if it doesn't look like a valid URL
  // that's fine, that means we can't get the path
  try {
    const { pathname } = new URL(url);
    const pathParts = pathname.split('/');
    if (pathParts[1]?.startsWith(VERSION_DELIMETER))
      return pathParts[1].replace(VERSION_DELIMETER, '');
  } catch (e) {}
}
