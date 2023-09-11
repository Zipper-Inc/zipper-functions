import signale from 'signale';
import shell, { exec } from './utils/shell';
import noop from './utils/noop';
import { dirname, basename } from 'path';

const getFileFromArgs = () =>
  // the file should always be the arg right after `deno:deploy`
  process.argv.find((_, i) => process.argv[i - 1]?.includes('/deno-deploy.ts'));

async function main() {
  const file = getFileFromArgs();

  if (!file) {
    signale.fatal(
      'Missing a Deno file. Add one with bun run deno:deploy <path/to/file>',
    );
    return;
  }

  const baseName = basename(file);

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

  let hasDeployCtl = await exec('command -v deployctl').catch(noop);

  if (!hasDeployCtl) {
    signale.pending('Installing Deno Deploy CLI');
    await shell('sh', [
      '-c',
      'deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts',
    ]);
    hasDeployCtl = true;
  }

  if (hasDeployCtl) signale.success('Deno Deploy CLI installed');

  const deployCtlArgs = process.argv.slice(
    process.argv.findIndex((_, i) =>
      process.argv[i - 1]?.includes('/deno-deploy.ts'),
    ) + 1,
  );

  if (!deployCtlArgs.find((arg) => arg.startsWith('token='))) {
    deployCtlArgs.push(`token=${process.env.DENO_DEPLOY_TOKEN}`);
  }

  if (!deployCtlArgs.find((arg) => arg.startsWith('project='))) {
    const [name] = baseName.split('.');
    deployCtlArgs.push(`project=z-${name}`);
  }

  // make sure not to upload any other files as static files, so we only include the one file
  if (!deployCtlArgs.find((arg) => arg.startsWith('include='))) {
    deployCtlArgs.push(`include=${baseName}`);
  }

  await shell(
    'deployctl',
    [
      'deploy',
      // Take the args and a `--` to them so they are compatible with `deployctl`
      // see here https://deno.com/deploy/docs/deployctl
      ...deployCtlArgs.map((arg) => `--${arg}`),
      baseName,
    ],
    {
      // run the deploy command from where the file lives
      cwd: dirname(file),
    },
  );
}

main();
