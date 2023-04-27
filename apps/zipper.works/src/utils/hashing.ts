import { App, Script } from '@prisma/client';
import hash from 'object-hash';

export function getScriptHash(
  script: Pick<Script, 'id' | 'filename' | 'code'>,
) {
  const { id, filename, code } = script;
  return hash(
    { id, filename, code },
    {
      algorithm: 'sha1',
    },
  );
}

export function getAppHash(
  app: Pick<App, 'id' | 'name'> & {
    scripts: Pick<Script, 'id' | 'hash'>[];
  },
) {
  const scripts = JSON.stringify(
    app.scripts
      .map(({ id, hash }) => ({
        id,
        hash,
      }))
      .sort((a, b) => (a.id > b.id ? 1 : -1)),
  );

  return hash(
    { id: app.id, name: app.name, scripts },
    {
      algorithm: 'sha1',
    },
  );
}

const APP_VERSION_LENGTH = 7;
export const getAppVersionFromHash = (hash: string) => {
  return hash.slice(0, APP_VERSION_LENGTH);
};
