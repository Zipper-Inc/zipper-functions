'use client';
import { cn, List } from '@zipper/ui';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  { label: 'All applets', type: null },
  { label: 'Productivity', type: 'productivity' },
  { label: 'Internal Tools', type: 'tools' },
  { label: 'Fun & Team Building', type: 'team' },
  { label: 'Connected Apps', type: 'connected' },
  { label: 'Slack Bots', type: 'slack' },
  { label: 'Utilities', type: 'utils' },
  { label: 'Workflows', type: 'workflows' },
];

const GalleryCategories: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <List as="nav" className="flex flex-col gap-2" data={CATEGORIES}>
      {(props, index) => {
        const cateogory = searchParams.get('category');
        const isActive = cateogory === props.type;

        return (
          <Link
            href={index === 0 ? pathname : `${pathname}?category=${props.type}`}
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
};

export { GalleryCategories };
