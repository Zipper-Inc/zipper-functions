import React, { useEffect } from 'react';
import { Gallery } from '~/components/gallery';
import { trpc } from '~/utils/trpc';
import NextError from 'next/error';
import { GetServerSideProps } from 'next';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { trpcRouter } from '~/server/routers/_app';
import SuperJSON from 'superjson';
import { createContext } from '~/server/context';
import { NextPageWithLayout } from '../_app';
import { useRouter } from 'next/router';

const ResourceOwnerPage: NextPageWithLayout = () => {
  const router = useRouter();

  const slug = router.query['resource-owner'] as string;

  const appsByResourceOwnerQuery = trpc.app.byResourceOwner.useQuery(
    {
      resourceOwnerSlug: slug,
    },
    {
      enabled: !!router.query['resource-owner'],
    },
  );

  if (appsByResourceOwnerQuery.error || !appsByResourceOwnerQuery.data) {
    return <NextError statusCode={404} />;
  }

  if (appsByResourceOwnerQuery.isSuccess) {
    return (
      <>
        <Gallery
          apps={appsByResourceOwnerQuery.data || []}
          subheading={
            appsByResourceOwnerQuery.data.length
              ? `Browse through public applets created by ${slug}`
              : ''
          }
        />
      </>
    );
  }

  return <></>;
};

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
}) => {
  const ssg = createServerSideHelpers({
    router: trpcRouter,
    transformer: SuperJSON,
    ctx: await createContext({ req, res }),
  });

  await ssg.app.byResourceOwner.fetch({
    resourceOwnerSlug: query['resource-owner'] as string,
  });

  return { props: { trpcState: ssg.dehydrate() } };
};

ResourceOwnerPage.skipAuth = true;

export default ResourceOwnerPage;
