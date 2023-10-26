#!/bin/deno
import { debounce } from 'https://deno.land/std@0.181.0/async/debounce.ts';
import { generateHash } from './generate-hash.ts';
import { generate, SRC_DIR } from './generate.ts';

// Run on start
generate();
generateHash();

// Re-run when the directory changes
const debouncedGenerate = debounce(async () => {
  generate();
  await generateHash();
}, 1000);

const watcher = Deno.watchFs([SRC_DIR, './deno/run.ts']);
for await (const _e of watcher) {
  debouncedGenerate();
}
