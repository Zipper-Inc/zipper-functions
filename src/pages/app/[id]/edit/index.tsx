import { GetServerSideProps } from 'next';

const EditPage = () => null;

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
