import { normalizeAppPath } from '@zipper/utils';
import path from 'path';

export default function getRunUrl(
  slug: string,
  version: string | null | undefined = 'latest',
  filename?: string,
) {
  const runPath = path.join(
    `run/${slug}/${version}`,
    normalizeAppPath(filename),
  );

  return `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${
    process.env.NEXT_PUBLIC_HOST
  }${process.env.NODE_ENV === 'production' ? '' : ':3000'}/${runPath}`;
}
