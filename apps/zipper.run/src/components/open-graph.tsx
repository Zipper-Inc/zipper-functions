export type OpenGraphProps = {
  title: string;
  description?: string;
  url?: string;
  image?: string;
};

export function OpenGraph({ title, description, url, image }: OpenGraphProps) {
  const imagePreviewUrl = `${url}.png`;
  return (
    <>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="Zipper" />
      <meta property="og:type" content="website" />
      {url && (
        <>
          <meta property="og:url" content={url} />
          <meta property="og:image" content={image} />
        </>
      )}
    </>
  );
}
