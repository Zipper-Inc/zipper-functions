'use client';
import { cn, List } from '@zipper/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = Record<'label' | 'href', string> & { disabled?: boolean };

interface DashboardSettingsNavProps<T extends NavItem> {
  data: T[];
}

function DashboardSettingsNav<T extends NavItem>(
  props: DashboardSettingsNavProps<T>,
) {
  const pathname = usePathname();

  return (
    <List as="nav" className="flex flex-col gap-2" data={props.data}>
      {(props, index) => {
        if (props.disabled) {
          return (
            <div className="text-gray-400 cursor-not-allowed px-4 h-11 flex items-center relative py-3">
              {props.label}
            </div>
          );
        }
        const fullPath = `/dashboard-tw/${props.href}`;

        const isActive = pathname === fullPath;

        return (
          <Link
            href={index === 0 ? pathname : fullPath}
            className={cn(
              isActive && 'bg-primary/10 text-primary',
              'px-3 py-2 rounded-sm transition-all hover:bg-foreground/10 cursor-pointer',
            )}
          >
            {props.label}
          </Link>
        );
      }}
    </List>
  );
}

export { DashboardSettingsNav };
