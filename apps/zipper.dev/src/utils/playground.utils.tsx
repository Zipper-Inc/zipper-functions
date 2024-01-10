import { NextRouter } from 'next/router';
import { Script } from '@prisma/client';
import { DehydratedState } from '@tanstack/react-query';
import { getUriFromPath } from './model-uri';
import type { Monaco } from '@monaco-editor/react';
import { getFileExtension } from '@zipper/utils';

export const isConnector = (script: Script) =>
  script.filename.endsWith('-connector.ts') ||
  script.filename.endsWith('-connector.tsx');
export const isReadme = (script: Script) => script.filename === 'readme.md';
export const isMain = (script: Script) => script.filename === 'main.ts';
export const isLib = (script: Script) =>
  isTypescript(script) &&
  !script.isRunnable &&
  !isConnector(script) &&
  !isMain(script);
export const isHandler = (script: Script) =>
  !isMain(script) && !isConnector(script) && script.isRunnable;
export const isTypescript = (script: Script) =>
  script.filename.endsWith('.ts') || script.filename.endsWith('.tsx');

export enum PlaygroundTab {
  Code = 'src',
  Schedules = 'schedules',
  Secrets = 'secrets',
  Runs = 'runs',
  Versions = 'versions',
  Settings = 'settings',
}

export type Props = {
  resourceOwnerSlug: string;
  appSlug: string;
  tab: PlaygroundTab;
  filename?: string;
  trpcState: DehydratedState;
};

export const parsePlaygroundQuery = (
  query: NextRouter['query'],
): Omit<Props, 'trpcState'> => {
  const resourceOwnerSlug = query['resource-owner'] as string;
  const appSlug = query['app-slug'] as string;

  let tab = PlaygroundTab.Code;
  let filename = 'main.ts';

  if (Array.isArray(query.playground) && query.playground.length) {
    const tabFromUrl = query.playground[0] as PlaygroundTab;
    if (Object.values(PlaygroundTab).includes(tabFromUrl)) {
      tab = tabFromUrl;
    }

    const filenameFromUrl = query.playground[1];
    if (filenameFromUrl) filename = filenameFromUrl;
  }

  return { resourceOwnerSlug, appSlug, tab, filename };
};

function parseScriptForModel(script: Script, { Uri }: Monaco) {
  const isMainScript = script.filename === 'main.ts';
  const extension = isMainScript ? 'tsx' : getFileExtension(script.filename);

  const path = script.filename;
  const uri = getUriFromPath(path, Uri.parse, extension || 'tsx');
  return { extension, path, uri };
}

export function getModelFromScript(script: Script, m: Monaco) {
  const { uri } = parseScriptForModel(script, m);
  return m.editor.getModel(uri);
}

export function getOrCreateScriptModel(script: Script, m: Monaco) {
  const existingModel = getModelFromScript(script, m);
  if (existingModel) return existingModel;
  const { uri } = parseScriptForModel(script, m);

  console.log('[EDITOR]', `Creating model for ${script.filename}`);

  return m.editor.createModel(
    script.code,
    // The language may be inferred from the `uri`
    undefined,
    uri,
  );
}
