import { NextPageWithLayout } from '~/pages/_app';
import NextError from 'next/error';
import { useRouter } from 'next/router';

import { trpc } from '~/utils/trpc';

import { withLiveBlocks } from '~/hocs/withLiveBlocks';

import { Playground } from '~/components/app/playground';
import { LiveObject } from '@liveblocks/client';
import { NoHeaderLayout } from '~/components/no-header-layout';
import { SignedIn } from '@clerk/nextjs';
import EditorContextProvider from '~/components/context/editorContext';

const PlaygroundPage: NextPageWithLayout = () => {
  const { query } = useRouter();

  const resourceOwnerSlug = query['resource-owner'] as string;
  const appSlug = query['app-slug'] as string;
  const filename = query.filename as string;

  const appQuery = trpc.useQuery([
    'app.byResourceOwnerAndAppSlugs',
    { resourceOwnerSlug, appSlug },
  ]);

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 404}
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
    () => (
      <EditorContextProvider
        appId={appQuery.data?.id}
        initialScripts={appQuery.data?.scripts || []}
      >
        <Playground app={appQuery.data} filename={filename} />
      </EditorContextProvider>
    ),
    {
      id: `${resourceOwnerSlug}/${appSlug}}`,
      initialStorage,
      initialPresence: {},
    },
  );

  return (
    <>
      {appQuery.data &&
        (appQuery.data.isPrivate ? (
          <SignedIn>{playground}</SignedIn>
        ) : (
          playground
        ))}
    </>
  );
};

PlaygroundPage.skipAuth = true;
PlaygroundPage.getLayout = (page) => <NoHeaderLayout>{page}</NoHeaderLayout>;

export default PlaygroundPage;
