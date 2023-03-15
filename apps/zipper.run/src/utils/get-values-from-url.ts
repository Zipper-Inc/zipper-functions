export function getFilenameAndVersionFromPath(path: string, endings: string[]) {
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
  getFilenameAndVersionFromPath,
};
