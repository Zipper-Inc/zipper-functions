/// <reference lib="dom" />
import fs from 'fs/promises';
import path from 'path';
import { exec } from './utils/shell';

const ENV_LOCAL_PATH = '.env.local';
const ENCODING = 'utf8';
const ENV_APPLET_URL = 'https://zipper-env-local.zipper.run/api';
const { ZIPPER_ENV_LOCAL_NGROK_URL, ZIPPER_ENV_LOCAL_ACCESS_TOKEN } =
  process.env;

const GENERATED_REG_EXP = new RegExp(
  '### <generated[\\d\\D]*?/generated>',
  'g',
);

const readEnvLocalFile = async () => {
  await exec(
    [
      `touch ${ENV_LOCAL_PATH}`,
      `cp ${ENV_LOCAL_PATH} ${ENV_LOCAL_PATH}.backup.${Date.now()}`,
    ].join(';'),
  );
  return fs.readFile(path.resolve(ENV_LOCAL_PATH), ENCODING);
};

const writeEnvLocalFile = async (file: string) =>
  fs.writeFile(path.resolve(ENV_LOCAL_PATH), file, ENCODING);

const fetchEnvValues = async () => {
  const { ok, data, error } = await fetch(
    `${ENV_APPLET_URL}?ngrokUrl=${ZIPPER_ENV_LOCAL_NGROK_URL}`,
    {
      headers: {
        Authorization: `Bearer ${ZIPPER_ENV_LOCAL_ACCESS_TOKEN}`,
      },
    },
  ).then((r) => r.json());

  if (!ok) throw new Error(`Fetch not ok: ${error}}`);

  return data;
};

async function main() {
  const envFile = await readEnvLocalFile();

  const fetchedEnvValues = [
    `### <generated>`,
    `### last updated ${new Date()}`,
    await fetchEnvValues(),
    `### </generated>`,
  ].join('\n');

  writeEnvLocalFile(
    GENERATED_REG_EXP.test(envFile)
      ? envFile.replace(GENERATED_REG_EXP, fetchedEnvValues)
      : [envFile, fetchedEnvValues].join('\n'),
  );
}

main();
