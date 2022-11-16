import signale from 'signale';
import { getPort } from 'get-port-please';
import shell, { exec } from '../src/utils/shell';
import noop from '../src/utils/noop';

const PORT_ARG = '--port=';
const getFileFromArgs = () =>
  process.argv.find((_, i) => process.argv[i - 1]?.includes('/deno-dev.ts'));
const getPortFromArgs = () =>
  process.argv.find((arg) => arg.startsWith(PORT_ARG))?.replace(PORT_ARG, '');

async function main() {
  const file = getFileFromArgs();

  if (!file) {
    signale.fatal(
      'Missing a Deno file. Add one with yarn deno:dev <path/to/file>',
    );
    return;
  }

  let hasDeno = await exec('command -v deno').catch(noop);

  if (!hasDeno) {
    signale.pending('Installing Deno');
    await shell('sh', [
      '-c',
      'curl -fsSL https://deno.land/x/install/install.sh | sh',
    ]);
    hasDeno = true;
  }

  if (hasDeno) signale.success('Deno installed');

  const port = getPortFromArgs() || (await getPort());

  signale.info(`The worker is deployed to http://localhost:${port}`);

  signale.watch('Start editing to see changes');

  await shell('deno', [
    'run',
    '--allow-all',
    '--watch',
    `--location=http://localhost:${port}`,
    file,
  ]);
}

main();
