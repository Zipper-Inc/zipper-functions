import React from 'react';
import { Gallery } from '~/components/gallery';

import { api } from '~/trpc/server';

export default async function GalleryPage() {
  const galleryApps = await api.gallery.getAllApproved.query();

  if (galleryApps) {
    return (
      <Gallery
        apps={galleryApps}
        isPublicGallery
        heading={'Applet Gallery'}
        subheading={`Wander through some of the applets we've built to show you what's possible with Zipper.

        If something sparks your interest, you can fork it or just browse through the code to see how it works.`}
      />
    );
  }
}

GalleryPage.skipAuth = true;
