export default function getRunUrl(
  slug: string,
  version: string | null | undefined = 'latest',
  filename?: string,
) {
  const path = `run/${slug}/${version}/${filename || 'main.ts'}`;

  return `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${
    process.env.NEXT_PUBLIC_HOST
  }${process.env.NODE_ENV === 'production' ? '' : ':3000'}/${path}`;
}
