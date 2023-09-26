import { useDebounce } from 'use-debounce';
import { slugifyAllowDot } from '~/utils/slugify';
import { trpc } from '~/utils/trpc';

export const MIN_SLUG_LENGTH = 5;

export const useScriptFilename = (
  filename = '',
  appId: string,
  extensions = ['.ts'],
) => {
  const filenameWithoutExt = filename.replace(
    new RegExp(`\\${extensions.join('$|\\')}$`),
    '',
  );

  const [debouncedFilename] = useDebounce(filenameWithoutExt, 500);

  const validateFilenameQuery = trpc.script.validateFilename.useQuery(
    {
      appId,
      newFilename: slugifyAllowDot(debouncedFilename || '') + extensions[0],
    },
    { enabled: !!debouncedFilename },
  );

  const isFilenameValid = validateFilenameQuery.data;

  return {
    debouncedFilename,
    isFilenameValid,
    validateFilenameQuery,
  };
};
