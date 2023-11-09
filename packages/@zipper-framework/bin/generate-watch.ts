#!/bin/deno
import { debounce } from 'https://deno.land/std@0.181.0/async/debounce.ts';
import { generate } from './generate.ts';

// Run on start
generate();

// Re-run when the directory changes
const debouncedGenerate = debounce(() => {
  generate();
}, 1000);

const watcher = Deno.watchFs('./deno');
for await (const _e of watcher) {
  if (_e.paths.some((path) => path.includes('/deno/applet/generated/'))) {
    continue;
  }
  debouncedGenerate();
}
