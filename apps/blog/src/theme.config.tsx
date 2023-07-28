const config = {
  footer: <p>© Zipper.</p>,
  head: ({ _title, meta }: any) => (
    <>
      {meta.description && (
        <meta name="description" content={meta.description} />
      )}
      {meta.tag && <meta name="keywords" content={meta.tag} />}
      {meta.author && <meta name="author" content={meta.author} />}
    </>
  ),
  readMore: 'Check it out',
  postFooter: null,
  darkMode: true,
  navs: [
    {
      url: 'https://zipper.dev',
      name: 'Home',
    },
  ],
};

export default config;
