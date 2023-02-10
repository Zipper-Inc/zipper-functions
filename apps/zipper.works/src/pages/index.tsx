import { createSSGHelpers } from '@trpc/react/ssg';
import { useUser } from '@clerk/nextjs';
import { GetServerSideProps } from 'next';
import { Dashboard } from '~/components/dashboard';
import { Gallery } from '~/components/gallery';
import { createContext } from '~/server/context';
import { getValidSubdomain, removeSubdomains } from '~/utils/subdomains';
import { NextPageWithLayout } from './_app';
import { trpcRouter } from '~/server/routers/_app';
import { inferQueryOutput, trpc } from '~/utils/trpc';
import SuperJSON from 'superjson';
import { getAuth } from '@clerk/nextjs/server';
import Header from '~/components/header';

export type GalleryAppQueryOutput = inferQueryOutput<
  'app.allApproved' | 'app.byResourceOwner'
>;

const IndexPage: NextPageWithLayout = (props) => {
  const { user, isLoaded } = useUser();

  const appsByResourceOwnerQuery = trpc.useQuery(
    ['app.byResourceOwner', { resourceOwnerSlug: props.subdomain as string }],
    {
      enabled: !!props.subdomain,
    },
  );

  const galleryAppsQuery = trpc.useQuery(['app.allApproved'], {
    enabled: !props.subdomain && !user,
  });

  if (props.subdomain && appsByResourceOwnerQuery.isSuccess) {
    return <Gallery apps={appsByResourceOwnerQuery.data} />;
  }

  if (user) {
    return <Dashboard />;
  }

  if (isLoaded && !user && galleryAppsQuery.isSuccess) {
    return <Gallery apps={galleryAppsQuery.data} />;
  }

  return <div></div>;
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  const { userId } = getAuth(req);

  const ssg = createSSGHelpers({
    router: trpcRouter,
    transformer: SuperJSON,
    ctx: await createContext({ req, res }),
  });

  if (subdomain) {
    try {
      await ssg.fetchQuery('app.byResourceOwner', {
        resourceOwnerSlug: subdomain,
      });
    } catch (e) {
      return {
        redirect: {
          destination: `${
            process.env.NODE_ENV === 'production' ? 'https' : 'http'
          }://${removeSubdomains(host!)}`,
        },
        props: {},
      };
    }

    return {
      props: {
        trpcState: ssg.dehydrate(),
        subdomain,
      },
    };
  }

  if (userId) {
    await ssg.fetchQuery('app.byAuthedUser');

    return {
      props: {
        trpcState: ssg.dehydrate(),
      },
    };
  }

  await ssg.fetchQuery('app.allApproved');

  return { props: { trpcState: ssg.dehydrate() } };
};

IndexPage.header = (props) => {
  if (props.subdomain) return <Header showNav={false}></Header>;
  return <Header></Header>;
};

IndexPage.skipAuth = true;

export default IndexPage;
