import { NextPage } from 'next';
import { AppProps } from 'next/app';
import { AppType } from 'next/dist/shared/lib/utils';
import { ReactElement, ReactNode } from 'react';

import { SessionProvider } from 'next-auth/react';

import { DefaultLayout } from '~/components/default-layout';

import '@fontsource/inter/variable.css';

import Header from '~/components/header';
import { useEffectOnce } from '@zipper/ui';
import { ZipperLocation } from '@zipper/types';
import SignedIn from '~/components/auth/signed-in';
import SignedOut from '~/components/auth/signed-out';
import RedirectToSignIn from '~/components/auth/redirect-to-signin';
import '@uploadthing/react/styles.css';
import '~/styles/global.css';
import { trpc } from '~/utils/trpc';

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<
  P,
  IP
> & {
  header?: (props: Record<string, unknown>) => ReactNode;
  getLayout?: (page: ReactElement) => ReactNode;
  skipAuth?: boolean;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  pageProps: Record<string, unknown>;
};

const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout =
    Component.getLayout ??
    ((page) => (
      <DefaultLayout
        header={
          Component.header ? Component.header({ ...pageProps }) : <Header />
        }
      >
        {page}
      </DefaultLayout>
    ));

  useEffectOnce(() => {
    window.ZipperLocation = ZipperLocation.ZipperDotDev;
  });
  return (
    <>
      <SessionProvider session={pageProps.session}>
        {Component.skipAuth ? (
          getLayout(<Component {...pageProps} />)
        ) : (
          <>
            <SignedIn>{getLayout(<Component {...pageProps} />)}</SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        )}
      </SessionProvider>
    </>
  );
}) as AppType;

export default trpc.withTRPC(MyApp);
