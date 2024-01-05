import { useDebounce } from 'use-debounce';
import { AllowedExtensionWithDot } from '~/utils/file-extension';
import { slugifyAllowDot } from '~/utils/slugify';
import { trpc } from '~/utils/trpc';

export const MIN_SLUG_LENGTH = 5;

export const useScriptFilename = (
  filename = '',
  appId: string,
  extensions: AllowedExtensionWithDot[] = ['.ts'],
) => {
  const filenameWithoutExt = filename.replace(
    new RegExp(`\\${extensions.join('$|\\')}$`),
    '',
  );

  const [debouncedFilename] = useDebounce(filenameWithoutExt, 500);

  // Flename should be unique, the extension here doesn't matter
  const validateFilenameQuery = trpc.script.validateFilename.useQuery(
    {
      appId,
      newFilename: slugifyAllowDot(debouncedFilename || ''),
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
