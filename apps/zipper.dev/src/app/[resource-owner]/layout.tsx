import React from 'react';
import { DashboardHeader } from '~/components/app-dir/layouts/header-new';

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <DashboardHeader />
      {children}
    </React.Fragment>
  );
}
