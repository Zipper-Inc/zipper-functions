type Params = { slug: string; path?: string; version?: string };

const getBaseUrl = (slug: string) => {
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  return new URL(
    `${protocol}://${slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}`,
  );
};

export const getRelayUrl = ({ slug, path, version }: Params) => {
  const url = getBaseUrl(slug);
  const pathParts = [path || 'main', 'relay'];
  if (version && version !== 'latest') pathParts.unshift(`@${version}`);
  url.pathname = `/${pathParts.join('/')}`;
  return url.toString();
};

export const getBootUrl: typeof getRelayUrl = ({ slug, version }) => {
  const url = getBaseUrl(slug);
  const pathParts = ['boot'];
  if (version && version !== 'latest') pathParts.unshift(`@${version}`);
  url.pathname = `/${pathParts.join('/')}`;
  return url.toString();
};
