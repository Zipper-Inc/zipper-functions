import { App, Script } from '@prisma/client';
import hash from 'object-hash';

const APP_VERSION_LENGTH = 7;

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
  app: Pick<App, 'id' | 'slug'> & {
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
    { id: app.id, slug: app.slug, scripts },
    {
      algorithm: 'sha1',
    },
  );
}

export function getAppHashAndVersion(
  app: Pick<App, 'id' | 'slug'> & {
    scripts: Pick<Script, 'id' | 'hash'>[];
  },
) {
  const hash = getAppHash(app);
  const version = hash.slice(0, APP_VERSION_LENGTH);
  return { hash, version };
}

export const getAppVersionFromHash = (hash?: string | null) => {
  if (!hash) return undefined;
  return hash.slice(0, APP_VERSION_LENGTH);
};
