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
  return `${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL}/${path}`;
}
