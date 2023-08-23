import { createSSGHelpers } from '@trpc/react/ssg';
import { GetServerSideProps } from 'next';
import { Gallery } from '~/components/gallery';
import { createContext } from '~/server/context';
import { getValidSubdomain, removeSubdomains } from '~/utils/subdomains';
import { NextPageWithLayout } from './_app';
import { trpcRouter } from '~/server/routers/_app';
import { inferQueryOutput, trpc } from '~/utils/trpc';
import SuperJSON from 'superjson';
import { useRouter } from 'next/router';
import Header from '~/components/header';
import { useUser } from '~/hooks/use-user';
import { authOptions } from './api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';

export type GalleryAppQueryOutput = inferQueryOutput<
  'app.allApproved' | 'app.byResourceOwner'
>;

const IndexPage: NextPageWithLayout = (props) => {
  const router = useRouter();
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

  if (isLoaded && !user && galleryAppsQuery.isSuccess) {
    return (
      <Gallery
        apps={galleryAppsQuery.data}
        heading="Popular Applets"
        subheading="Browse popular internal tools being built on Zipper"
      />
    );
  }

  if (user) {
    router.push('/dashboard');
  }
  return <div></div>;
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  const session = await getServerSession(req, res, authOptions);

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

  if (session?.user) {
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
