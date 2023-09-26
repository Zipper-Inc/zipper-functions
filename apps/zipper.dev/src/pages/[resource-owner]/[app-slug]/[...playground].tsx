import { NextPageWithLayout } from '~/pages/_app';

import { trpc } from '~/utils/trpc';

import { withLiveBlocks } from '~/hocs/withLiveBlocks';

import { Playground } from '~/components/playground/playground';
import { LiveObject } from '@liveblocks/client';
import EditorContextProvider from '~/components/context/editor-context';
import { Box, Button, Center, Heading, Link, VStack } from '@chakra-ui/react';
import Head from 'next/head';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getValidSubdomain, removeSubdomains } from '~/utils/subdomains';
import SignedIn from '~/components/auth/signed-in';
import Header from '~/components/header';
import {
  parsePlaygroundQuery,
  Props,
  PlaygroundTab,
} from '~/utils/playground.utils';
import { HelpModeProvider } from '~/components/context/help-mode-context';

const PlaygroundPage: NextPageWithLayout<Props> = ({
  resourceOwnerSlug,
  appSlug,
  tab,
  filename,
}) => {
  const appQuery = trpc.app.byResourceOwnerAndAppSlugs.useQuery(
    { resourceOwnerSlug, appSlug },
    { retry: false },
  );
  const utils = trpc.useContext();

  if (appQuery.error) {
    return (
      <>
        <Header />
        <Center>
          <VStack spacing={10}>
            <Heading>Looks like this applet doesn't exist</Heading>
            <Button as={Link} href={'/'} colorScheme="purple">
              Go back home
            </Button>
          </VStack>
        </Center>
      </>
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

  const refetchApp = async () => {
    utils.app.byResourceOwnerAndAppSlugs.invalidate({
      resourceOwnerSlug,
      appSlug,
    });
    utils.app.byId.invalidate({ id: appQuery.data.id });
  };

  const playground = withLiveBlocks(
    () => (
      <EditorContextProvider
        app={appQuery.data}
        appId={appQuery.data?.id}
        appSlug={appQuery.data.slug}
        resourceOwnerSlug={appQuery.data.resourceOwner.slug}
        initialScripts={appQuery.data?.scripts || []}
        refetchApp={refetchApp}
      >
        <HelpModeProvider>
          <Playground app={appQuery.data} filename={filename} tab={tab} />
        </HelpModeProvider>
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
  query,
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

  return { props: parsePlaygroundQuery(query) };
};

PlaygroundPage.skipAuth = true;
PlaygroundPage.header = () => <Box pt="20px"></Box>;

export default PlaygroundPage;
