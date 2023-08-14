export function getFilenameAndVersionFromPath(
  path: string,
  endings: string[] = [],
) {
  let newPath = path;
  const descEndings = endings.sort((a, b) => b.length - a.length);

  //find longest ending that the path ends with - '/api/json' will match before '/json'
  descEndings.find((ending) => {
    if (path.endsWith(ending)) {
      newPath = path.replace(ending, '');
      return true;
    }
  });

  let filename = 'main.ts';
  let version: string | undefined;

  // split the path without endings on / - remove any empty parts
  const parts = newPath.split('/').filter((s) => s.length !== 0);

  // for each part, check if it's a version (based on @) otherwise assume it's a filename
  // if there are multiple parts, the last part is the filename
  parts.forEach((part) => {
    if (part[0] === '@') version = part.slice(1);
    else filename = part;
  });

  if (version === 'latest') {
    version = undefined;
  }

  if (!filename.endsWith('.ts')) filename = `${filename}.ts`;

  return { filename, version };
}

export default {
  getFilenameAndVersionFromPath,
};
