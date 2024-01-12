import { removeExtension } from '@zipper/utils';
import { useDebounce } from 'use-debounce';
import { slugifyAllowDot } from '~/utils/slugify';
import { trpc } from '~/utils/trpc';

export const MIN_SLUG_LENGTH = 5;

export const useScriptFilename = (filename: string, appId: string) => {
  const filenameWithoutExt = removeExtension(filename);

  const [debouncedFilename] = useDebounce(filenameWithoutExt, 500);

  // Filename should be unique, the extension here doesn't matter
  const validateFilenameQuery = trpc.script.validateFilename.useQuery(
    {
      appId,
      newFilename: slugifyAllowDot(debouncedFilename || ''),
    },
    { enabled: !!debouncedFilename },
  );

  const isFilenameValid = !!validateFilenameQuery.data;

  return {
    debouncedFilename,
    isFilenameValid,
    validateFilenameQuery,
  };
};
