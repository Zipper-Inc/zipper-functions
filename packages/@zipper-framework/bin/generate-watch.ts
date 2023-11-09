#!/bin/deno
import { debounce } from 'https://deno.land/std@0.181.0/async/debounce.ts';
import { generate, SRC_DIR } from './generate.ts';
import file from '../package.json' assert { type: 'json' };

const HASH_FILE_PATH = `../../apps/zipper.dev/src/framework-version.ts`;

export function writeVersion() {
  Deno.writeTextFileSync(
    HASH_FILE_PATH,
    `//generated - don't edit
export const frameworkVersion = "${file.version}"`,
  );

  Deno.run({
    cmd: ['yarn', 'prettier', HASH_FILE_PATH, '-w'],
  });
}

// Run on start
writeVersion();
generate();

const srcWatcher = Deno.watchFs(SRC_DIR);
for await (const _e of srcWatcher) {
  debounce(generate, 1000)();
}

const versionWatcher = Deno.watchFs('../package.json');
for await (const _e of versionWatcher) {
  debounce(writeVersion, 1000);
}
