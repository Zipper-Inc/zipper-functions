#!/bin/deno
import { debounce } from 'https://deno.land/std@0.181.0/async/debounce.ts';
import { generate, SRC_DIR } from './generate.ts';
import { writeVersion } from './write-version.ts';

// Run on start
writeVersion();
generate();

const srcWatcher = Deno.watchFs([SRC_DIR, './package.json']);
for await (const _e of srcWatcher) {
  debounce(() => {
    generate;
    writeVersion();
  }, 1000)();
}
