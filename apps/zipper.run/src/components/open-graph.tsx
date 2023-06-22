export type OpenGraphProps = {
  appTitle: string;
  runUrl?: string;
};

export function OpenGraph({ appTitle, runUrl }: OpenGraphProps) {
  const imagePreviewUrl = `${runUrl}.png`;
  return (
    <>
      <meta name="description" content="The Description" />
      <meta property="og:title" content={appTitle} />
      <meta property="og:description" content="The Description" />
      <meta property="og:site_name" content="Zipper" />
      <meta property="og:type" content="website" />
      {runUrl && (
        <>
          <meta property="og:url" content={runUrl} />
          <meta property="og:image" content={imagePreviewUrl} />
        </>
      )}
    </>
  );
}
