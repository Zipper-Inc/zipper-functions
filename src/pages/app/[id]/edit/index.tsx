import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const EditPage: NextPageWithLayout = () => {
  const router = useRouter();
  const appQuery = trpc.useQuery([
    'app.byId',
    { id: router.query.id as string },
  ]);

  useEffect(() => {
    if (appQuery.data) {
      router.push(
        `/app/${appQuery.data.id}/edit/${appQuery.data.scriptMain?.script.filename}`,
      );
    }
  }, [appQuery.data]);

  return <></>;
};

export default EditPage;
