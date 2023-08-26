#!/bin/deno
import { generateIndexForFramework } from '../../@zipper-utils/src/utils/generate-for-framework.ts';

export const APPLET_ROOT = './deno/applet';
export const SRC_DIR = `${APPLET_ROOT}/src`;
export const GEN_FILE_PATH = `${APPLET_ROOT}/generated/index.gen.ts`;

export function generate() {
  const filenames = Array.from(Deno.readDirSync(SRC_DIR))
    .filter(
      (f) => f.isFile && f.name !== 'main.ts' && /\.(ts|tsx)$/.test(f.name),
    )
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
