import ogSlugify from 'slugify';

const DEFAULT_OPTIONS: Options = {
  lower: true,
  strict: true,
  remove: /[*+~.()'"!:@]/g,
};

type Options = Exclude<Parameters<typeof ogSlugify>[1], string>;

const slugify = (string: string, options: Options = {}) =>
  ogSlugify(string, { ...DEFAULT_OPTIONS, ...options });

export default slugify;

export const slugifyAllowDot: typeof slugify = (string, options) =>
  ogSlugify(string, {
    ...DEFAULT_OPTIONS,
    ...options,
    strict: false,
    remove: /[*+~()'"!:@]/g,
  });
