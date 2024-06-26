import { useRouter } from 'next/router';
import NextError from 'next/error';
import { trpc } from '~/utils/trpc';
import { NextPageWithLayout } from '../../_app';
import { useEffect } from 'react';

export const AppIdPage: NextPageWithLayout = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const appQuery = trpc.app.byId.useQuery({ id });

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 404}
      />
    );
  }

  useEffect(() => {
    if (appQuery.data) {
      router.push(
        `/${appQuery.data.resourceOwner.slug}/${appQuery.data.slug}/src`,
      );
    }
  }, [appQuery.data]);

  return <></>;
};

export default AppIdPage;

AppIdPage.header = () => <></>;
