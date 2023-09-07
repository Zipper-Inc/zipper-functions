import 'nextra-theme-blog/style.css';
import '@fontsource/inter/variable.css';
import Head from 'next/head';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@zipper/ui';
import { Global } from '@emotion/react';

const Fonts = () => (
  <Global
    styles={`
      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 300;
        src: url('/fonts/plaak/Plaak - 26-Ney-Light-205TF.otf') format('opentype');
      }

      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 400;
        src: url('/fonts/plaak/Plaak - 36-Ney-Regular-205TF.otf') format('opentype');
      }

      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 700;
        src: url('/fonts/plaak/Plaak - 46-Ney-Bold-205TF.otf') format('opentype');
      }

      @font-face {
        font-family: 'Plaak';
        font-style: normal;
        font-weight: 900;
        src: url('/fonts/plaak/Plaak - 56-Ney-Heavy-205TF.otf') format('opentype');
      }
    `}
  />
);

export default function Nextra({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS"
          href="/feed.xml"
        />
        <link
          rel="preload"
          href="/fonts/Inter-roman.latin.var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <ChakraProvider theme={theme}>
        <Fonts />
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}
