'use client';
import { List, Show } from '@zipper/ui';
import Header from '~/components/app-dir/layouts/header';
import { AppletCard } from '~/components/app-dir/modules/applet/card';
import { GalleryCategories } from '~/components/app-dir/modules/gallery/components/categories';
import { GalleryFAQ } from '~/components/app-dir/modules/gallery/components/faq';
import { Navbar } from '~/components/app-dir/layouts/navbar';
import { NextPageWithLayout } from '../../../../pages/_app';
import React from 'react';
import { trpc } from '~/utils/trpc';
import NextError from 'next/error';
import { GetServerSideProps } from 'next';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { trpcRouter } from '~/server/routers/_app';
import SuperJSON from 'superjson';
import { createContext } from '~/server/context';
import { AnalyticsHead } from '@zipper/utils';

const LINKS = [
  { label: 'Ziplets', href: '/gallery-test' },
  { label: 'Saved Ziplets', href: '/gallery-test/saved', disabled: true },
];

const GalleryPage: NextPageWithLayout = () => {
  const galleryApps = trpc.app.allApproved.useQuery();

  if (galleryApps.error) {
    return <NextError statusCode={500} />;
  }

  return (
    <React.Fragment>
      <AnalyticsHead />
      <main className="px-12 mt-6 flex flex-col gap-6">
        <h1 className="text-4xl font-bold">Ziplets Gallery</h1>
        <Navbar links={LINKS} />

        <div className="grid grid-cols-4 gap-9">
          <section className="col-span-1 flex flex-col gap-6">
            <p>
              Wander through some of the applets we've built to show you what's
              possible with Zipper.
              <br />
              <br />
              If something sparks your interest, you can fork it or just browse
              through the code to see how it works.
            </p>
            <div className="flex flex-col gap-4">
              <h3 className="uppercase font-bold text-xs text-gray-400">
                categories
              </h3>
              <GalleryCategories />
            </div>
            <GalleryFAQ />
          </section>

          <section className="col-span-3 h-10 grid grid-cols-2 gap-6">
            <Show
              when={galleryApps.isSuccess && galleryApps.data?.length >= 1}
              fallback="loading..."
            >
              <List data={galleryApps.data}>
                {(props) => <AppletCard app={props} />}
              </List>
            </Show>
          </section>
        </div>
      </main>
    </React.Fragment>
  );
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

GalleryPage.header = () => <Header showDivider={false} showOrgSwitcher />;
GalleryPage.skipAuth = true;

export default GalleryPage;
