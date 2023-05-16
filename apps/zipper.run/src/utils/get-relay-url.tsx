type Params = { slug: string; path?: string };

const getBaseUrl = (slug: string) => {
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  return new URL(
    `${protocol}://${slug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`,
  );
};

export const getRelayUrl = ({ slug, path }: Params) => {
  const url = getBaseUrl(slug);
  url.pathname = `/${path || 'main'}/relay`;
  return url.toString();
};

export const getBootUrl: typeof getRelayUrl = ({ slug }) => {
  const url = getBaseUrl(slug);
  url.pathname = '/boot';
  return url.toString();
};
