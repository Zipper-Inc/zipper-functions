import {
  crypto,
  toHashString,
} from 'https://deno.land/std@0.204.0/crypto/mod.ts';

export const HASH_FILE_PATH = `../../apps/zipper.dev/framework-hash.ts`;

export async function generateHash() {
  const code = Deno.readTextFileSync('./deno/run.ts');
  const hash = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(code),
  );

  Deno.writeTextFileSync(
    HASH_FILE_PATH,
    `//generated - don't edit
export const frameworkHash = "${toHashString(hash)}"`,
  );

  Deno.run({
    cmd: ['yarn', 'prettier', HASH_FILE_PATH, '-w'],
  });
}

generateHash();
