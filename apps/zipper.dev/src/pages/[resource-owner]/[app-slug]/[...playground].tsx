import { Button, Center, Heading, Link, VStack } from '@chakra-ui/react';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { TRPCError } from '@trpc/server';
import { NOT_FOUND, UNAUTHORIZED } from '@zipper/utils';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Head from 'next/head';

import SuperJSON from 'superjson';
import SignedIn from '~/components/auth/signed-in';
import EditorContextProvider from '~/components/context/editor-context';
import { HelpModeProvider } from '~/components/context/help-mode-context';
import { DefaultLayout } from '~/components/default-layout';
import Header from '~/components/header';
import { Playground } from '~/components/playground/playground';
import { NextPageWithLayout } from '~/pages/_app';
import { createContext } from '~/server/context';
import { trpcRouter } from '~/server/routers/_app';
import { parsePlaygroundQuery, Props } from '~/utils/playground.utils';

import { api as trpc } from '~/server/react';

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

  const refetchApp: typeof appQuery.refetch = async (options) => {
    console.log('[EDITOR]', 'Refetching applet from database');
    utils.app.byResourceOwnerAndAppSlugs.invalidate({
      resourceOwnerSlug,
      appSlug,
    });
    utils.app.byId.invalidate({ id: appQuery.data.id });
    return appQuery.refetch(options);
  };

  const playground = (
    <EditorContextProvider
      app={appQuery.data}
      appId={appQuery.data?.id}
      appSlug={appQuery.data.slug}
      resourceOwnerSlug={appQuery.data.resourceOwner.slug}
      refetchApp={refetchApp}
      readOnly={appQuery.data.canUserEdit === false}
    >
      <HelpModeProvider>
        <Playground app={appQuery.data} filename={filename} tab={tab} />
      </HelpModeProvider>
    </EditorContextProvider>
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
  const ctx = await createContext({ req, res });
  const props = parsePlaygroundQuery(query);
  const ssg = createServerSideHelpers({
    router: trpcRouter,
    transformer: SuperJSON,
    ctx,
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
    if (
      /^No\s.*\sfound$/.test(e?.message) ||
      (e instanceof TRPCError && [NOT_FOUND, UNAUTHORIZED].includes(e.code))
    ) {
      return { notFound: true };
    }
    throw e;
  }

  return { props: { ...props, trpcState: ssg.dehydrate() } };
};

PlaygroundPage.header = () => <></>;
PlaygroundPage.getLayout = (page) => (
  <DefaultLayout header={<></>} p="0" h="full" w="full">
    {page}
  </DefaultLayout>
);

export default PlaygroundPage;
