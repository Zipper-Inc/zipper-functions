import { NextPageWithLayout } from './_app';
import React from 'react';
import { Gallery } from '~/components/gallery';

const GalleryPage: NextPageWithLayout = () => {
  return <Gallery />;
};

GalleryPage.skipAuth = true;

export default GalleryPage;
