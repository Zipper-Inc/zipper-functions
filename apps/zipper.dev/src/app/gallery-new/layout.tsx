import React from 'react';
import { GalleryHeader } from '~/components/app-dir/layouts/header-new';

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <GalleryHeader />
      {children}
    </React.Fragment>
  );
}
