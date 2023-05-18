#!/bin/deno
import { generateIndexForFramework } from '../../@zipper-utils/src/utils/generate-index-for-framework.ts';

export const SRC_DIR = './deno/src';
export const GEN_FILE_PATH = './deno/generated/index.gen.ts';

export function generate() {
  const filenames = Array.from(Deno.readDirSync(SRC_DIR))
    .filter((f) => f.isFile && f.name !== 'main.ts' && f.name.endsWith('.ts'))
    .map((f) => f.name);
  const code = Deno.readTextFileSync(GEN_FILE_PATH);

  Deno.writeTextFileSync(
    GEN_FILE_PATH,
    generateIndexForFramework({ code, filenames }),
  );

  Deno.run({
    cmd: ['yarn', 'prettier', GEN_FILE_PATH, '-w'],
  });
}

generate();
