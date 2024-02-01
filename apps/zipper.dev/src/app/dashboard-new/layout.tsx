import { Toaster } from '@zipper/tw/ui';
import React from 'react';
import { DashboardHeader } from '~/components/app-dir/layouts/header-new';
import { Link, Navbar } from '~/components/app-dir/layouts/navbar';

const NAVBAR_LINKS: Link[] = [
  { label: 'Applets', href: `/dashboard-new` },
  { label: 'People', href: `/dashboard-new/people` },
  { label: 'Settings', href: `/dashboard-new/settings` },
];

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <DashboardHeader />
      <main className="w-full px-12 mt-6 flex flex-col gap-6">
        <Navbar links={NAVBAR_LINKS} />
        <Toaster />
        {children}
      </main>
    </React.Fragment>
  );
}
