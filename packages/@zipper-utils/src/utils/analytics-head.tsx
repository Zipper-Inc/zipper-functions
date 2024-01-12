import Head from 'next/head';

const AnalyticsHead = ({ tagId }: { tagId?: string }) => {
  return (
    <Head>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${
          tagId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
        }`}
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', ${tagId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}, {
          page_path: window.location.pathname,
        });
        `,
        }}
      />
    </Head>
  );
};

export { AnalyticsHead };
