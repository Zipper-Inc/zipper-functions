import { useSession } from 'next-auth/react';
import { Dashboard } from '~/components/dashboard';
import Header from '~/components/header';
import { NextPageWithLayout } from './_app';

const DashboardPage: NextPageWithLayout = () => {
  console.log(useSession());
  return <Dashboard />;
};

DashboardPage.header = () => (
  <Header showOrgSwitcher={true} showDivider={false} />
);

export default DashboardPage;
