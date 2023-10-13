import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { Dashboard } from '~/components/dashboard';
import Header from '~/components/header';
import { authOptions } from './api/auth/[...nextauth]';
import { NextPageWithLayout } from './_app';

const DashboardPage: NextPageWithLayout = () => {
  return <Dashboard />;
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);
  const setting = session?.user?.settings?.find(
    (s) => s.settingName === 'showWelcomeMessage',
  );
  const createdAfterWelcomeAdded =
    session?.user?.createdAt &&
    new Date(session?.user?.createdAt) >= new Date(1697175829153);

  if (
    createdAfterWelcomeAdded &&
    (!setting || setting.settingValue === 'true')
  ) {
    return {
      redirect: {
        destination: '/auth/welcome',
        permanent: false,
      },
    };
  }

  return { props: { hasUser: false } };
};

DashboardPage.header = () => (
  <Header showOrgSwitcher={true} showDivider={false} />
);

export default DashboardPage;
