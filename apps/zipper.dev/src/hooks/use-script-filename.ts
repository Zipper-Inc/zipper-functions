import { useDebounce } from 'use-debounce';
import { slugifyAllowDot } from '~/utils/slugify';
import { trpc } from '~/utils/trpc';

export const MIN_SLUG_LENGTH = 5;

export const useScriptFilename = (filename: string, appId: string) => {
  const [debouncedFilename] = useDebounce(filename, 500);

  const validateFilenameQuery = trpc.useQuery(
    [
      'script.validateFilename',
      {
        appId,
        newFilename: slugifyAllowDot((debouncedFilename as string) || ''),
      },
    ],
    { enabled: !!debouncedFilename },
  );

  const isFilenameValid = validateFilenameQuery.data;

  return { debouncedFilename, isFilenameValid, validateFilenameQuery };
};
