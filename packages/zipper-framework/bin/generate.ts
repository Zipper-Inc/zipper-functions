#!/bin/deno
import { generateHandlersForFramework } from '../../@zipper-utils/src/utils/generate-handlers-for-framework.ts';

export const SRC_DIR = './src';
export const GEN_FILE_PATH = './generated/handlers.gen.ts';

export function generate() {
  const filenames = Array.from(Deno.readDirSync(SRC_DIR))
    .filter((f) => f.isFile && f.name !== 'main.ts' && f.name.endsWith('.ts'))
    .map((f) => f.name);
  const code = Deno.readTextFileSync(GEN_FILE_PATH);

  Deno.writeTextFileSync(
    GEN_FILE_PATH,
    generateHandlersForFramework({ code, filenames }),
  );

  Deno.run({
    cmd: ['yarn', 'prettier', GEN_FILE_PATH, '-w'],
  });
}

generate();
