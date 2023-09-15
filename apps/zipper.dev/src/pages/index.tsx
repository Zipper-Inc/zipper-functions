import { GetServerSideProps } from 'next';
import { NextPageWithLayout } from './_app';
import { useRouter } from 'next/router';
import { authOptions } from './api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import HomePage from './home';

const IndexPage: NextPageWithLayout = (props) => {
  const router = useRouter();

  // const appsByResourceOwnerQuery = trpc.useQuery(
  //   ['app.byResourceOwner', { resourceOwnerSlug: props.subdomain as string }],
  //   {
  //     enabled: !!props.subdomain,
  //   },
  // );

  // const galleryAppsQuery = trpc.useQuery(['app.allApproved'], {
  //   enabled: !props.subdomain && !user,
  // });

  // if (props.subdomain && appsByResourceOwnerQuery.isSuccess) {
  //   return <Gallery apps={appsByResourceOwnerQuery.data} />;
  // }

  if (!props.hasUser) {
    return <HomePage />;
  }

  return <div></div>;
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (session?.user) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return { props: { hasUser: false } };
};

IndexPage.header = (props) => {
  return <></>;
};

IndexPage.skipAuth = true;

export default IndexPage;
