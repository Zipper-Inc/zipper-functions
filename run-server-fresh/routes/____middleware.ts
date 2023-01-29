// versions are in the url, like app-slug.zipper.run/*@v1234
const VERSION_PATH_PREFIX = '/*@';

function getSubdomain({ host }: URL) {
  const hostParts = host.split('.');
  // this way localhost and the main domain don't count
  return hostParts.length >= 3 && hostParts[0] !== 'www' ? hostParts[0] : null;
}

function getVersionAndPath({ href, pathname, origin }: URL) {
  let version;
  let path = href.replace(origin, '');

  if (pathname.startsWith(VERSION_PATH_PREFIX)) {
    const parts = pathname.replace(VERSION_PATH_PREFIX, '').split('/');
    version = parts[0];
    path = path.replace(`${VERSION_PATH_PREFIX}${version}`, '');
  }

  return { version, path };
}
