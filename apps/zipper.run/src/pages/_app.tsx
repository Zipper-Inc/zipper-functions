import { ClerkProvider } from '@clerk/nextjs';
import type { AppProps } from 'next/app';
import '@fontsource/inter';
import '@fontsource/inter/variable.css';
import { useEffectOnce } from '@zipper/ui';
import { ZipperLocation } from '@zipper/types';

function MyApp({ Component, pageProps }: AppProps) {
  useEffectOnce(() => {
    window.ZipperLocation = ZipperLocation.ZipperDotRun;
  });

  return (
    <ClerkProvider
      appearance={{
        variables: {
          borderRadius: '0.175',
          fontFamily: 'Inter',
          colorPrimary: '#9B2FB4',
        },
      }}
      {...pageProps}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
