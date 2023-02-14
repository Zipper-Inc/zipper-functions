export default function getRunUrl(slug: string) {
  return `${
    process.env.NODE_ENV === 'production' ? 'https' : 'http'
  }://${slug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}/call`;
}
