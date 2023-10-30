#!/bin/deno
import { debounce } from 'https://deno.land/std@0.181.0/async/debounce.ts';
import { generateHash } from './generate-hash.ts';
import { generate } from './generate.ts';

// Run on start
generate();
generateHash();

// Re-run when the directory changes
const debouncedGenerate = debounce(() => {
  generate();
  generateHash();
}, 1000);

const watcher = Deno.watchFs('./deno');
for await (const _e of watcher) {
  if (_e.paths.some((path) => path.includes('/deno/applet/generated/'))) {
    continue;
  }
  debouncedGenerate();
}
