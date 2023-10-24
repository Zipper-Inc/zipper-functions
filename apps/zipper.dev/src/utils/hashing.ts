import { App, Script } from '@prisma/client';
import hash from 'object-hash';

const APP_VERSION_LENGTH = 7;

const normalizeCodeForHashing = (code = '') => code.trimEnd();

export function getScriptHash(
  script: Pick<Script, 'appId' | 'filename' | 'code'>,
) {
  const { appId, filename, code } = script;

  return hash(
    { appId, filename, code: normalizeCodeForHashing(code) },
    {
      algorithm: 'sha1',
    },
  );
}

export function getAppHash(
  app: Pick<App, 'id' | 'slug'> & {
    scripts: Pick<Script, 'filename' | 'hash'>[];
  },
) {
  const scripts = JSON.stringify(
    app.scripts
      .map(({ filename, hash }) => ({
        filename,
        hash,
      }))
      .sort((a, b) => (a.filename > b.filename ? 1 : -1)),
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
    scripts: Pick<Script, 'filename' | 'hash'>[];
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
