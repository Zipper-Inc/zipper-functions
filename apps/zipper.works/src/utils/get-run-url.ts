export default function getRunUrl(
  slug: string,
  version = Date.now().toString(32),
) {
  return `${
    process.env.NODE_ENV === 'production' ? 'https' : 'http'
  }://${slug}.${
    process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
  }/@${version}/call`;
}
