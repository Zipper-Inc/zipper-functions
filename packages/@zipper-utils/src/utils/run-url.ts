type RunUrlProps = {
  subdomain: string;
  version?: string;
  isBoot?: boolean;
  isEmbed?: boolean;
  isRun?: boolean;
  filename?: string;
  action?: string;
  responseModifier?: string;
  isRelay?: boolean;
  isApi?: boolean;
  apiFormat?: string;
};

// This beast of a regex parses the path into the following groups:
// - version: 7 character git has, must be the first thing in the url
// - isEmbed: matches the 'embed' token if its there (optional)
// - isRun: matches the 'run' token if its there (optional), can be used with isEmbed
// - path: the path to the file, can be empty cause we just assume its main.ts
//    - this can be anything except for $ and api, which tells us its an action or api request
// - action: the action to run, must be prefixed with a $
// - isApi: matches the 'api' token if its there (optional)
// - apiFormat: the format of the api request, must be one of json, yaml, or html, optional since we default to json
const PATH_PARSE_REGEX =
  /^\/?(?:(?:@(?<version>[0-9a-f]{7}))?(?:\/?(?<isEmbed>embed))?(?:\/?(?<isRun>run))?\/?(?<path>(?!\$|relay|raw|api).*?)?(?:\/?\$(?<action>.+?)?\/?)?(?<responseModifier>\/?(?<isRelay>(?:raw|relay))|(?<isApi>api\/?(?<apiFormat>.+)?))?)$/;
const EXTENSION_REGEX = /\.tsx?$/;

const __BOOT__ = '__BOOT__';

/**
 * @todo change this when https://github.com/Zipper-Inc/zipper-functions/pull/601 ships
 */
const DEFAULT_EXTENSION = 'ts';

const ensureTsExtension = (filename: string) =>
  EXTENSION_REGEX.test(filename)
    ? filename
    : [filename, DEFAULT_EXTENSION].join('.');

const formatPath = (path = '') => path.replace(EXTENSION_REGEX, '') || 'main';

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

export function parseRunUrlPath(path: string): Omit<RunUrlProps, 'subdomain'> {
  // remove double slashes cause they mess up the regex
  const matches =
    path.replace(/\/\/+/, '/').match(PATH_PARSE_REGEX)?.groups || {};

  // split the path without endings on / - remove any empty parts
  // assume the last part of the path is the filename for now
  const filename = ensureTsExtension(
    matches.path
      ?.split('/')
      .filter((s) => s.length > 0)
      .pop() || 'main',
  );

  const isBoot = filename === 'boot.ts';

  return {
    version: matches.version === 'latest' ? undefined : matches.version,
    isBoot,
    isEmbed: !!matches.isEmbed,
    isRun: !!matches.isRun,
    filename: isBoot ? __BOOT__ : filename,
    action: matches.action,
    responseModifier: matches.responseModifier,
    isRelay: !!matches.isRelay,
    isApi: !!matches.isApi,
    apiFormat: !matches.isApi ? undefined : matches.apiFormat || 'json',
  };
}

export function getRunUrl({
  subdomain,
  version,
  isBoot,
  isRun,
  isEmbed,
  filename,
  action,
  responseModifier,
  isRelay,
  isApi,
  apiFormat,
}: RunUrlProps): URL {
  const url = getBaseUrl(subdomain);

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

    if (responseModifier) {
      pathParts.push(responseModifier);
    } else if (isRelay) {
      pathParts.push('relay');
    } else if (isApi) {
      pathParts.push('api');

      if (apiFormat) {
        pathParts.push(apiFormat);
      }
    }
  }

  url.pathname = `/${pathParts.join('/')}`;
  return url;
}

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
  return getRunUrl({
    subdomain: slug,
    filename: path,
    version,
    action,
    isRelay: true,
  }).toString();
};

export const getBootUrl: typeof getRelayUrl = ({ slug, version }) =>
  getRunUrl({ subdomain: slug, version, isBoot: true }).toString();

export const getRunPageUrl: typeof getRelayUrl = ({
  slug,
  path,
  action,
  version,
}) =>
  getRunUrl({
    subdomain: slug,
    filename: path,
    action,
    version,
    isRun: true,
  }).toString();
