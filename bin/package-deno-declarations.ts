import * as fs from 'fs';

const DENO_DECLARATIONS_PATH = '../deno/cli/tsc/dts';

/**
 * Reads *.d.ts files from a copy of the Deno repo
 * Outputs as a JSON file so we can inject them into our editor
 */
function main() {
  const map: Record<string, string> = {};

  fs.readdirSync(DENO_DECLARATIONS_PATH).forEach((filename) => {
    map[filename] = fs.readFileSync(
      `${DENO_DECLARATIONS_PATH}/${filename}`,
      'utf-8',
    );
  });

  fs.writeFileSync('./apps/zipper.works/src/types/deno/d.json', JSON.stringify(map));
}

main();
