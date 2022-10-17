import ogSlugify from 'slugify';

const DEFAULT_OPTIONS = {
  lower: true,
};

const slugify = (
  string: string,
  options?: {
    replacement?: string;
    remove?: RegExp;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
  },
) => ogSlugify(string, { ...DEFAULT_OPTIONS, ...options });

export default slugify;
