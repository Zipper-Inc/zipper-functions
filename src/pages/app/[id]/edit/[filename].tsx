import { NextPageWithLayout } from '~/pages/_app';
import NextError from 'next/error';
import { useRouter } from 'next/router';
import { SessionAuth } from 'supertokens-auth-react/recipe/session';

import { trpc } from '~/utils/trpc';

import { withLiveBlocks } from '~/hocs/withLiveBlocks';

import { Playground } from '~/components/app/playground';
import { LiveObject } from '@liveblocks/client';
import { NoHeaderLayout } from '~/components/no-header-layout';

const AppPage: NextPageWithLayout = () => {
  const { query } = useRouter();

  const id = query.id as string;
  const filename = query.filename as string;

  const appQuery = trpc.useQuery(['app.byId', { id }]);

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (appQuery.status !== 'success') {
    return <></>;
  }

  const { data } = appQuery;

  const initialStorage: any = {
    app: new LiveObject({
      slug: data.slug,
      name: data.name,
      description: data.description,
    }),
  };

  appQuery.data?.scripts.forEach((s) => {
    initialStorage[`script-${s.id}`] = new LiveObject({
      code: s.code,
    });
  });

  const playground = withLiveBlocks(
    () => <Playground app={appQuery.data} filename={filename} />,
    {
      id,
      initialStorage,
      initialPresence: {},
    },
  );

  return (
    <>
      {appQuery.data &&
        (appQuery.data.isPrivate ? (
          <SessionAuth>{playground}</SessionAuth>
        ) : (
          playground
        ))}
    </>
  );
};

AppPage.skipAuth = true;
AppPage.getLayout = (page) => <NoHeaderLayout>{page}</NoHeaderLayout>;

export default AppPage;
