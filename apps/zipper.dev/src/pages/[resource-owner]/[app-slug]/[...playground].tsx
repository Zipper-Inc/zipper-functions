import { Box, Button, Center, Heading, Link, VStack } from '@chakra-ui/react';
import { LiveObject } from '@liveblocks/client';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import SuperJSON from 'superjson';
import SignedIn from '~/components/auth/signed-in';
import EditorContextProvider from '~/components/context/editor-context';
import { HelpModeProvider } from '~/components/context/help-mode-context';
import Header from '~/components/header';
import { Playground } from '~/components/playground/playground';
import { withLiveblocksRoom } from '~/hocs/with-liveblocks';
import { NextPageWithLayout } from '~/pages/_app';
import { createContext } from '~/server/context';
import { trpcRouter } from '~/server/routers/_app';
import { parsePlaygroundQuery, Props } from '~/utils/playground.utils';
import { trpc } from '~/utils/trpc';

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

  const playground = withLiveblocksRoom(
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
      room: `${resourceOwnerSlug}/${appSlug}`,
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
  res,
  query,
}: GetServerSidePropsContext) => {
  const props = parsePlaygroundQuery(query);
  const ssg = createServerSideHelpers({
    router: trpcRouter,
    transformer: SuperJSON,
    ctx: await createContext({ req, res }),
  });

  try {
    const result = await ssg.app.byResourceOwnerAndAppSlugs.fetch({
      resourceOwnerSlug: props.resourceOwnerSlug,
      appSlug: props.appSlug,
    });

    if (!result?.id) {
      return { notFound: true };
    }
  } catch (e: any) {
    if (/^No\s.*\sfound$/.test(e?.message)) {
      return { notFound: true };
    }
    throw e;
  }

  return { props: { ...props, trpcState: ssg.dehydrate() } };
};

PlaygroundPage.skipAuth = true;
PlaygroundPage.header = () => <Box pt="20px"></Box>;

export default PlaygroundPage;
