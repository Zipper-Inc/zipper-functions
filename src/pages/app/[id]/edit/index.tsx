import { GetServerSideProps } from 'next';
import { NextPageWithLayout } from '~/pages/_app';

const EditPage: NextPageWithLayout = () => null;

export const getServerSideProps: GetServerSideProps = async (
  context,
): Promise<any> => {
  return {
    redirect: {
      destination: `${context.req.url}/main.ts`,
    },
  };
};

export default EditPage;
