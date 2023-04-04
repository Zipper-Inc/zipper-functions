import fs from 'fs/promises';
import path from 'path';

export const FRAMEWORK_PATH = path.resolve(
  '../..',
  'packages/zipper-framework/deno',
);

export async function readFrameworkFile(filename: string) {
  return await fs.readFile(path.resolve(FRAMEWORK_PATH, filename), 'utf8');
}
