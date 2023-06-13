import React, { useEffect } from 'react';
import { Gallery } from '~/components/gallery';
import { trpc } from '~/utils/trpc';
import NextError from 'next/error';
import { GetServerSideProps } from 'next';
import { createSSGHelpers } from '@trpc/react/ssg';
import { trpcRouter } from '~/server/routers/_app';
import SuperJSON from 'superjson';
import { createContext } from '~/server/context';
import { NextPageWithLayout } from '../_app';
import { useRouter } from 'next/router';

const ResourceOwnerPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [heading, setHeading] = React.useState<string>(
    router.query['resource-owner'] as string,
  );

  const slug = router.query['resource-owner'] as string;

  const appsByResourceOwnerQuery = trpc.useQuery(
    [
      'app.byResourceOwner',
      {
        resourceOwnerSlug: slug,
      },
    ],
    {
      enabled: !!router.query['resource-owner'],
    },
  );

  const clerkQuery = trpc.useQuery([
    'resourceOwnerSlug.lookupOnClerk',
    {
      slug,
    },
  ]);

  useEffect(() => {
    if (clerkQuery.data) setHeading(clerkQuery.data.name as string);
  }, [clerkQuery.data]);

  if (appsByResourceOwnerQuery.error) {
    return <NextError statusCode={404} />;
  }

  if (appsByResourceOwnerQuery.isSuccess) {
    return (
      <>
        <Gallery
          apps={appsByResourceOwnerQuery.data}
          resourceOwnerId={clerkQuery.data?.id}
          resourceOwnerType={clerkQuery.data?.resourceOwnerType}
          preheading={heading !== slug ? heading : undefined}
          heading={slug}
          subheading={'Recent Applets'}
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
  const ssg = createSSGHelpers({
    router: trpcRouter,
    transformer: SuperJSON,
    ctx: await createContext({ req, res }),
  });

  await ssg.fetchQuery('app.byResourceOwner', {
    resourceOwnerSlug: query['resource-owner'] as string,
  });

  return { props: { trpcState: ssg.dehydrate() } };
};

ResourceOwnerPage.skipAuth = true;

export default ResourceOwnerPage;
