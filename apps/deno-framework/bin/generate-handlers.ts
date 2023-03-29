#!/bin/deno
import { generateHandlersForFramework } from '../../../packages/@zipper-utils/src/utils/generate-handlers-for-framework.ts';

const SRC_DIR = './src';
const GEN_FILE_PATH = './generated/handlers.gen.ts';

const filenames = Array.from(Deno.readDirSync(SRC_DIR))
  .filter((f) => f.isFile && f.name !== 'main.ts' && f.name.endsWith('.ts'))
  .map((f) => f.name);
const code = Deno.readTextFileSync(GEN_FILE_PATH);

Deno.writeTextFileSync(
  GEN_FILE_PATH,
  generateHandlersForFramework({ code, filenames }),
);
