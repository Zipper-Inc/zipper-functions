import Header from '~/components/layouts/header';
import { NextPageWithLayout } from './_app';

const TestPage: NextPageWithLayout = () => {
  return (
    <div className="w-screen">
      <h1>hey</h1>
    </div>
  );
};

TestPage.header = () => <Header />;

export default TestPage;
