import path from 'path';

const DEFAULT_PATH = 'main.ts';
const LEADING_DOT = /^\./;
const LEADING_SLASH = /^\//;
const TRAILING_SLASH = /\/$/;
const EMPTY_STRING = /^$/;

/**
 * Normalizes paths for apps to match filenames
 * @example "/" => "main.ts"
 * @example "./utils" => "utils.ts"
 * @example "/constants.ts" => "constants.ts"
 *
 */
export const normalizeAppPath = (appPath: string = DEFAULT_PATH) =>
  path
    .normalize(appPath)
    .replace(LEADING_DOT, '')
    .replace(LEADING_SLASH, '')
    .replace(TRAILING_SLASH, '')
    .replace(EMPTY_STRING, DEFAULT_PATH);

/**
 * Gets the zipper.run link for a given app slug
 */
export const getAppLink = (slug: string) => {
  return `${slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}`;
};
