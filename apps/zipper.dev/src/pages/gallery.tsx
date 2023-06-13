import { NextPageWithLayout } from './_app';
import React from 'react';
import { Gallery } from '~/components/gallery';
import { trpc } from '~/utils/trpc';
import NextError from 'next/error';
import { GetServerSideProps } from 'next';
import { createSSGHelpers } from '@trpc/react/ssg';
import { trpcRouter } from '~/server/routers/_app';
import SuperJSON from 'superjson';
import { createContext } from '~/server/context';

const GalleryPage: NextPageWithLayout = () => {
  const galleryApps = trpc.useQuery(['app.allApproved']);

  if (galleryApps.error) {
    return <NextError statusCode={500} />;
  }

  if (galleryApps.isSuccess) {
    return (
      <Gallery
        apps={galleryApps.data}
        heading={'Popular Applets'}
        subheading="Browse through popular applets on Zipper"
      />
    );
  }

  return <></>;
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const ssg = createSSGHelpers({
    router: trpcRouter,
    transformer: SuperJSON,
    ctx: await createContext({ req, res }),
  });

  await ssg.fetchQuery('app.allApproved');

  return { props: { trpcState: ssg.dehydrate() } };
};

GalleryPage.skipAuth = true;

export default GalleryPage;
