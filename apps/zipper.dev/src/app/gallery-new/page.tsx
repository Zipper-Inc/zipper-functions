import { Show } from '@zipper/tw/ui/modules/show-content';
import { List } from '@zipper/tw/ui/modules/list';

import { AnalyticsHead } from '@zipper/utils';
import React from 'react';
import { Navbar } from '~/components/app-dir/layouts/navbar';
import { AppletCard } from '~/components/app-dir/modules/applet/card';
import { GalleryCategories } from '~/components/app-dir/modules/gallery/components/categories';
import { GalleryFAQ } from '~/components/app-dir/modules/gallery/components/faq';
import { api } from '~/trpc/server';

const LINKS = [
  { label: 'Ziplets', href: '/gallery-test' },
  { label: 'Saved Ziplets', href: '/gallery-test/saved', disabled: true },
];

export default async function GalleryPage() {
  const galleryApps = await api.app.allApproved.query();

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
            <Show when={galleryApps.length > 0}>
              <List data={galleryApps}>
                {(props) => <AppletCard app={props} />}
              </List>
            </Show>
          </section>
        </div>
      </main>
    </React.Fragment>
  );
}
