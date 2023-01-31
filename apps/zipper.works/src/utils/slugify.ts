import ogSlugify from 'slugify';

const DEFAULT_OPTIONS = {
  lower: true,
  remove: /[*+~.()'"!:@]/g,
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
