import { Link, Navbar } from '../../layouts/navbar';
import React, { ReactNode } from 'react';
import { Show, Toaster } from '@zipper/ui';

const NAVBAR_LINKS: Link[] = [
  { label: 'Applets', href: `/dashboard-tw` },
  { label: 'People', href: `/dashboard-tw/people` },
  { label: 'Settings', href: `/dashboard-tw/settings` },
];

const DashboardLayout = ({
  children,
  showNav = true,
}: {
  children: ReactNode;
  showNav?: boolean;
}) => {
  return (
    <main className="px-12 mt-6 flex flex-col gap-6">
      <Show when={showNav}>
        <Navbar links={NAVBAR_LINKS} />
      </Show>
      <Toaster />
      {children}
    </main>
  );
};

export default DashboardLayout;
