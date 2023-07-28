import { getZipperDotDevUrlForServer } from '../server/utils/server-url.utils';

export default function getRunUrl(
  slug: string,
  version: string | null | undefined = 'latest',
  filename?: string,
) {
  return buildUrl(`run/${slug}/${version}/${filename || 'main.ts'}`);
}

export function getBootUrl(
  slug: string,
  version: string | null | undefined = 'latest',
) {
  return buildUrl(`boot/${slug}/${version}`);
}

function buildUrl(path: string) {
  const url = getZipperDotDevUrlForServer();
  url.pathname = path;
  return url.toString();
}
