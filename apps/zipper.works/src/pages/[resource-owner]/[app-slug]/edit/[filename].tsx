import { NextPageWithLayout } from '~/pages/_app';
import NextError from 'next/error';
import { useRouter } from 'next/router';

import { trpc } from '~/utils/trpc';

import { withLiveBlocks } from '~/hocs/withLiveBlocks';

import { Playground } from '~/components/app/playground';
import { LiveObject } from '@liveblocks/client';
import { SignedIn } from '@clerk/nextjs';
import EditorContextProvider from '~/components/context/editor-context';
import { Box } from '@chakra-ui/react';
import Head from 'next/head';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getValidSubdomain, removeSubdomains } from '~/utils/subdomains';

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

  const pageTitle = `${data.resourceOwner.slug} / ${data.name || data.slug}`;

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
        appSlug={appQuery.data.slug}
        resourceOwnerSlug={appQuery.data.resourceOwner.slug}
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
      <Head>
        <title>{pageTitle}</title>
      </Head>
      {appQuery.data &&
        (appQuery.data.isPrivate ? (
          <SignedIn>{playground}</SignedIn>
        ) : (
          playground
        ))}
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  req,
  resolvedUrl,
}: GetServerSidePropsContext) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);

  if (subdomain) {
    return {
      redirect: {
        destination: `${
          process.env.NODE_ENV === 'production' ? 'https' : 'http'
        }://${removeSubdomains(host!)}/${resolvedUrl}`,
      },
      props: {},
    };
  }

  return { props: {} };
};

PlaygroundPage.skipAuth = true;
PlaygroundPage.header = () => <Box mt={4}></Box>;

export default PlaygroundPage;
