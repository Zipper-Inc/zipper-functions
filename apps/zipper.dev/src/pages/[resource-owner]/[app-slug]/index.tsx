import { GetServerSideProps } from 'next';
import Header from '~/components/header';
import { NextPageWithLayout } from '~/pages/_app';

const AppPage: NextPageWithLayout = () => {
  return <></>;
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  return {
    redirect: {
      destination: `/${query['resource-owner']}/${query['app-slug']}/edit/readme.md`,
      permanent: false,
    },
  };
};

AppPage.skipAuth = true;
AppPage.header = (page) => {
  return <Header showNav={!page.subdomain as boolean} />;
};

export default AppPage;
