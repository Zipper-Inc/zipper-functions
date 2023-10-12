import { NextRouter } from 'next/router';
import { Script } from '@prisma/client';
import { DehydratedState } from '@tanstack/react-query';

export const isConnector = (script: Script) =>
  script.filename.endsWith('-connector.ts');
export const isReadme = (script: Script) => script.filename === 'readme.md';
export const isMain = (script: Script) => script.filename === 'main.ts';
export const isLib = (script: Script) =>
  script.filename.endsWith('.ts') &&
  !script.isRunnable &&
  !isConnector(script) &&
  !isMain(script);
export const isHandler = (script: Script) =>
  !isMain(script) && !isConnector(script) && script.isRunnable;

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
