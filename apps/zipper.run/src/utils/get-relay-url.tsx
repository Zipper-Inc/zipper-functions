const formatPath = (path = '') => path.replace(/\.tsx?$/, '') || 'main';

const formatVersion = (version: string) =>
  version.startsWith('@') ? version : `@${version}`;

const formatAction = (action: string) =>
  action.startsWith('$') ? action : `$${action}`;

const getBaseUrl = (slug: string) => {
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  return new URL(
    `${protocol}://${slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}`,
  );
};

export const getAppletUrl = ({
  name,
  version,
  isBoot,
  isRun,
  isEmbed,
  filename,
  action,
  restOfThePath,
}: {
  name: string;
  version?: string;
  isBoot?: boolean;
  isEmbed?: boolean;
  isRun?: boolean;
  filename?: string;
  action?: string;
  restOfThePath?: string;
}): URL => {
  const url = getBaseUrl(name);

  const pathParts = [];

  if (version && version !== 'latest') {
    pathParts.push(formatVersion(version));
  }

  if (isBoot) {
    pathParts.push('boot');
  } else {
    if (isEmbed) {
      pathParts.push('embed');
    }

    if (isRun) {
      pathParts.push('run');
    }

    if (filename) {
      pathParts.push(formatPath(filename));
    }

    if (action) {
      pathParts.push(formatAction(action));
    }

    if (restOfThePath) {
      pathParts.push(restOfThePath);
    }
  }

  url.pathname = `/${pathParts.join('/')}`;
  return url;
};

export const getRelayUrl = ({
  slug,
  path,
  action,
  version,
}: {
  slug: string;
  path?: string;
  version?: string;
  action?: string;
}) => {
  return getAppletUrl({
    name: slug,
    filename: path,
    version,
    action,
    restOfThePath: 'relay',
  }).toString();
};

export const getBootUrl: typeof getRelayUrl = ({ slug, version }) =>
  getAppletUrl({ name: slug, version, isBoot: true }).toString();

export const getRunPageUrl: typeof getRelayUrl = ({
  slug,
  path,
  action,
  version,
}) =>
  getAppletUrl({
    name: slug,
    filename: path,
    action,
    version,
    isRun: true,
  }).toString();
