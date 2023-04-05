import fs from 'fs/promises';
import path from 'path';

const ENCODING = 'utf8';

export const PACKAGES_PATH = path.resolve('../../packages');

export const FRAMEWORK_INTERNAL_PATH = '@zipper-framework/deno';
export const FRAMEWORK_PATH = path.resolve(
  PACKAGES_PATH,
  FRAMEWORK_INTERNAL_PATH,
);

export const DENO_TYPES_PATH = path.resolve(
  PACKAGES_PATH,
  'deno-types/generated/deno.d.ts',
);

export async function readDenoTypes() {
  return await fs.readFile(DENO_TYPES_PATH, ENCODING);
}

export async function readFrameworkFile(filename: string) {
  return await fs.readFile(path.resolve(FRAMEWORK_PATH, filename), ENCODING);
}
