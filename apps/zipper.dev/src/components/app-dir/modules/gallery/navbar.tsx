'use client';
import { cn, List, Show } from '@zipper/ui';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

const links = [
  { label: 'Ziplets', href: '/gallery-test' },
  { label: 'Saved Ziplets', href: '/gallery-test/saved', disabled: true },
];

const NavLink: React.FC<(typeof links)[number] & { active: boolean }> = ({
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
        active && 'text-primary dark bg-primary/10',
      )}
    >
      {label}
      <Show when={active === true}>
        <span className="absolute -bottom-5 left-0 w-full h-px bg-primary" />
      </Show>
    </Link>
  );
};

export const Navbar: React.FC = () => {
  const { pathname } = useRouter();

  return (
    <React.Fragment>
      <List as="nav" className="flex items-center gap-2" data={links}>
        {(props) => <NavLink {...props} active={pathname === props.href} />}
      </List>
      <span id="divider" className="w-full h-px bg-border -mt-1" />
    </React.Fragment>
  );
};
