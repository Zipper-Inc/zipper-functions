import type { AppProps } from 'next/app';

import '~/styles/global.css';

import '@fontsource/inter';
import '@fontsource/inter/variable.css';
import { useEffectOnce } from '@zipper/ui';
import { ZipperLocation } from '@zipper/types';

function MyApp({ Component, pageProps }: AppProps) {
  useEffectOnce(() => {
    window.ZipperLocation = ZipperLocation.ZipperDotRun;
  });

  return <Component {...pageProps} />;
}

export default MyApp;
