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

const ensureTsExtension = (filename: string) =>
  filename.endsWith('.ts') ? filename : `${filename}.ts`;

export function parseAppletPath(path: string) {
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

  return {
    filename: filename === 'boot.ts' ? '__BOOT__' : filename,
    version: matches.version === 'latest' ? undefined : matches.version,
    action: matches.action,
  };
}
