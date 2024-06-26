import { App, Script } from '@prisma/client';
import hash from 'object-hash';
import { frameworkVersion } from '../framework-version.gen';

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
  app: Pick<App, 'id' | 'slug' | 'secretsHash'> & {
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

  const hashContent: any = {
    id: app.id,
    slug: app.slug,
    scripts,
  };
  if (frameworkVersion !== '0.0.0') {
    hashContent.frameworkVersion = frameworkVersion;
  }

  if (app.secretsHash) {
    hashContent.secretsHash = app.secretsHash;
  }

  return hash(hashContent, {
    algorithm: 'sha1',
  });
}

export function getAppHashFromScripts(
  app: Pick<App, 'id' | 'slug' | 'secretsHash'>,
  scripts: Pick<Script, 'appId' | 'filename' | 'code'>[],
) {
  return getAppHash({
    ...app,
    scripts: scripts.map((script) => ({
      filename: script.filename,
      hash: getScriptHash(script),
    })),
  });
}

export function getAppHashAndVersion(
  app: Pick<App, 'id' | 'slug' | 'secretsHash'> & {
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
