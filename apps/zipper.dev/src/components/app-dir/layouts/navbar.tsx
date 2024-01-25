'use client';
import { cn } from '@zipper/tw/cn';
import { Show } from '@zipper/tw/ui/modules/show-content';
import { List } from '@zipper/tw/ui/modules/list';

import Link from 'next/link';

import { usePathname } from 'next/navigation';
import React from 'react';

export type Link = {
  label: string;
  href: string;
  disabled?: boolean;
};

const NavLink: React.FC<Link & { active: boolean }> = ({
  label,
  active = false,
  disabled = false,
  href,
}) => {
  if (disabled) {
    return (
      <div className="text-gray-400 cursor-not-allowed px-4 h-11 flex items-center relative py-3">
        {label}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        'text-muted-foreground font-medium px-4 h-11 flex items-center relative py-3 rounded-sm transition-all hover:bg-muted-foreground/10',
        active && 'text-primary bg-primary/10',
      )}
    >
      {label}
      <Show when={active === true}>
        <span className="absolute -bottom-5 left-0 w-full h-px bg-primary" />
      </Show>
    </Link>
  );
};

interface NavbarProps {
  links: Link[];
}

export const Navbar: React.FC<NavbarProps> = ({ links }) => {
  const pathname = usePathname();

  return (
    <section className="flex flex-col gap-6">
      <List as="nav" className="flex items-center gap-2" data={links}>
        {(props) => <NavLink {...props} active={pathname === props.href} />}
      </List>
      <span id="divider" className="w-full h-px bg-border -mt-1" />
    </section>
  );
};
