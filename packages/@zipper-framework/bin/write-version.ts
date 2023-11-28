const HASH_FILE_PATHS = [
  `../../apps/zipper.dev/src/framework-version.gen.ts`,
  `./deno/applet/generated/framework-version.gen.ts`,
];

export async function writeVersion() {
  const packageJson = JSON.parse(await Deno.readTextFile('./package.json'));
  HASH_FILE_PATHS.forEach((path) => {
    Deno.writeTextFileSync(
      path,
      `//generated - don't edit
export const frameworkVersion = "${packageJson.version}" as string;`,
    );

    Deno.run({
      cmd: ['yarn', 'prettier', path, '-w'],
    });
  });
}
