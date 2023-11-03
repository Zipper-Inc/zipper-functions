import { NextPageWithLayout } from './_app';
import React from 'react';
import { Gallery } from '~/components/gallery';
import { trpc } from '~/utils/trpc';
import NextError from 'next/error';
import { GetServerSideProps } from 'next';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { trpcRouter } from '~/server/routers/_app';
import SuperJSON from 'superjson';
import { createContext } from '~/server/context';
import { AnalyticsHead } from '@zipper/utils';

const GalleryPage: NextPageWithLayout = () => {
  const galleryApps = trpc.app.allApproved.useQuery();

  if (galleryApps.error) {
    return <NextError statusCode={500} />;
  }

  if (galleryApps.isSuccess) {
    return (
      <>
        <AnalyticsHead />
        <Gallery
          apps={galleryApps.data}
          isPublicGallery
          heading={'Applet Gallery'}
          subheading={`Wander through some of the applets we've built to show you what's possible with Zipper.

        If something sparks your interest, you can fork it or just browse through the code to see how it works.`}
        />
      </>
    );
  }

  return <></>;
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const ssg = createServerSideHelpers({
    router: trpcRouter,
    transformer: SuperJSON,
    ctx: await createContext({ req, res }),
  });

  await ssg.app.allApproved.fetch();

  return { props: { trpcState: ssg.dehydrate() } };
};

GalleryPage.skipAuth = true;

export default GalleryPage;
