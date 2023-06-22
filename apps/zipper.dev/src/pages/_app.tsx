import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { withTRPC } from '@trpc/next';
import { NextPage } from 'next';
import { AppProps } from 'next/app';
import { AppType } from 'next/dist/shared/lib/utils';
import { ReactElement, ReactNode } from 'react';
import superjson from 'superjson';
import { SessionProvider } from 'next-auth/react';

import { DefaultLayout } from '~/components/default-layout';
import { AppRouter } from '~/server/routers/_app';
import '@fontsource/inter/variable.css';
import Header from '~/components/header';
import { useEffectOnce } from '@zipper/ui';
import { ZipperLocation } from '@zipper/types';
import SignedIn from '~/components/auth/signed-in';
import SignedOut from '~/components/auth/signed-out';
import RedirectToSignIn from '~/components/auth/redirect-to-signin';
import "@uploadthing/react/styles.css";

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

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  // reference for vercel.com
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // // reference for render.com
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export default withTRPC<AppRouter>({
  config({ ctx }) {
    if (typeof window !== 'undefined') {
      // during client requests
      return {
        transformer: superjson, // optional - adds superjson serialization
        url: '/api/trpc',
      };
    }

    return {
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
      /**
       * @link https://trpc.io/docs/data-transformers
       */
      transformer: superjson,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
      headers() {
        if (ctx?.req) {
          // To use SSR properly, you need to forward the client's headers to the server
          // This is so you can pass through things like cookies when we're server-side rendering
          // If you're using Node 18, omit the "connection" header
          const { ...headers } = ctx.req.headers;
          return {
            ...headers,
            // Optional: inform server that it's an SSR request
            'x-ssr': '1',
          };
        }
        return {};
      },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
  /**
   * Set headers or status code when doing SSR
   */
  // responseMeta(opts) {
  //   const ctx = opts.ctx as SSRContext;

  //   if (ctx.status) {
  //     // If HTTP status set, propagate that
  //     return {
  //       status: ctx.status,
  //     };
  //   }

  //   const error = opts.clientErrors[0];
  //   if (error) {
  //     // Propagate http first error from API calls
  //     return {
  //       status: error.data?.httpStatus ?? 500,
  //     };
  //   }
  //   // For app caching with SSR see https://trpc.io/docs/caching
  //   return {};
  // },
})(MyApp);
