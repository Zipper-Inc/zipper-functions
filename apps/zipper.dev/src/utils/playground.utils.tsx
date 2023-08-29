import { NextRouter } from 'next/router';

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
};

export const parsePlaygroundQuery = (query: NextRouter['query']): Props => {
  console.log('ppq', { query });
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

  console.log('ppq', { resourceOwnerSlug, appSlug, tab, filename });
  return { resourceOwnerSlug, appSlug, tab, filename };
};
