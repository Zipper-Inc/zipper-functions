import { useUser } from '@clerk/nextjs';
import { useDebounce } from 'use-debounce';
import { trpc } from '~/utils/trpc';

export const MIN_SLUG_LENGTH = 5;

export const useAppSlug = (slug: string) => {
  const [debouncedSlug] = useDebounce(slug, 200);
  const { user } = useUser();

  const appSlugQuery = trpc.useQuery(
    ['app.validateSlug', { slug: debouncedSlug }],
    { enabled: !!(debouncedSlug.length >= MIN_SLUG_LENGTH) && !!user },
  );
  const slugExists = appSlugQuery.data;

  return { debouncedSlug, slugExists, appSlugQuery };
};
