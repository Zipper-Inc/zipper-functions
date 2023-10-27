import {
  crypto,
  toHashString,
} from 'https://deno.land/std@0.204.0/crypto/mod.ts';

const HASH_FILE_PATH = `../../apps/zipper.dev/framework-hash.ts`;

const readFiles = (dir = './deno', code = '') => {
  for (const dirEntry of Deno.readDirSync(dir)) {
    if (dirEntry.isFile) {
      const content = Deno.readTextFileSync(`${dir}/${dirEntry.name}`);
      code = code + content;
    } else {
      code = code + readFiles(`${dir}/${dirEntry.name}`, code);
    }
  }
  return code;
};

export function generateHash() {
  const code = readFiles();
  const hash = crypto.subtle.digestSync('MD5', new TextEncoder().encode(code));

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
