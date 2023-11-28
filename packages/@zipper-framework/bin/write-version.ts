const HASH_FILE_PATH = `../../apps/zipper.dev/src/framework-version.ts`;

export async function writeVersion() {
  const packageJson = JSON.parse(await Deno.readTextFile('./package.json'));
  Deno.writeTextFileSync(
    HASH_FILE_PATH,
    `//generated - don't edit
export const frameworkVersion = "${packageJson.version}" as string;`,
  );

  Deno.run({
    cmd: ['yarn', 'prettier', HASH_FILE_PATH, '-w'],
  });
}
