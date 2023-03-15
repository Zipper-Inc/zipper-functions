export const VERSION_DELIMETER = '@';
export const FILENAME_DELIMETER = '+';

function getFromFromUrl(url: string, delimiter: string): string | void {
  // new URL will throw if it doesn't look like a valid URL
  // that's fine, that means we can't get the path
  try {
    const { pathname } = new URL(url);
    const pathParts = pathname.split('/');
    const matchingPart = pathParts.find((p) => {
      return p.startsWith(delimiter);
    });
    if (matchingPart) return matchingPart.replace(delimiter, '');
  } catch (e) {}
}

/**
 * Matches the first part of the URL path to see if we've passed a version
 * @example https://my-app-name.zipper.run/@fooversion => fooversion
 */
export function getVersionFromUrl(url: string): string | void {
  return getFromFromUrl(url, VERSION_DELIMETER);
}

export function getFilenameFromUrl(url: string): string | void {
  return getFromFromUrl(url, FILENAME_DELIMETER);
}

export function getFilenameAndVersionWithoutDelimitersFromUrl(
  path: string,
  endings: string[],
) {
  let newPath = path;
  endings.forEach((ending) => {
    if (path.endsWith(ending)) {
      newPath = path.replace(ending, '');
    }
  });

  let filenameFromUrl: string | undefined = undefined;
  let versionFromUrl: string | undefined = undefined;
  const versionAndFilename = newPath.split('/').filter((s) => s.length !== 0);
  const len = versionAndFilename.length;

  if (len > 1) {
    filenameFromUrl = versionAndFilename[len - 1];
    versionFromUrl = versionAndFilename.slice(0, len - 1).join('');
  }

  if (len === 1) {
    versionAndFilename[0]?.includes('.')
      ? (filenameFromUrl = versionAndFilename[0])
      : (versionFromUrl = versionAndFilename[0]);
  }

  return { filename: filenameFromUrl, version: versionFromUrl };
}

export default {
  getFilenameFromUrl,
  getVersionFromUrl,
  getFilenameAndVersionWithoutDelimitersFromUrl,
};
