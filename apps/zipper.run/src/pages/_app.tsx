import type { AppProps } from 'next/app';
import '@fontsource/inter';
import '@fontsource/inter/variable.css';
import '@uploadthing/react/styles.css';
import { UploadProvider, useEffectOnce } from '@zipper/ui';
import { ZipperLocation } from '@zipper/types';
import { useEffect, useState } from 'react';
import { Router } from 'next/router';
import { Box, Center, Spinner } from '@chakra-ui/react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffectOnce(() => {
    window.ZipperLocation = ZipperLocation.ZipperDotRun;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => {
      setLoading(true);
    };
    const end = () => {
      setLoading(false);
    };

    Router.events.on('routeChangeStart', start);
    Router.events.on('routeChangeComplete', end);
    Router.events.on('routeChangeError', end);

    return () => {
      Router.events.off('routeChangeStart', start);
      Router.events.off('routeChangeComplete', end);
      Router.events.off('routeChangeError', end);
    };
  }, []);

  return (
    <>
      {loading ? (
        <Box w="100%" h="100vh">
          <Center h="100%">
            <Spinner color="purple" w="20px" h="20px" />
          </Center>
        </Box>
      ) : (
        <UploadProvider>
          <Component {...pageProps} />
        </UploadProvider>
      )}
    </>
  );
}

export default MyApp;
