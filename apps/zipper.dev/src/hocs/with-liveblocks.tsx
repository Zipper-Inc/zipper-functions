import { ReactElement } from 'react';
import { ClientSideSuspense } from '@liveblocks/react';
import { RoomProvider } from '~/liveblocks.config';
import { App, ResourceOwnerSlug } from '@prisma/client';

export const getLiveblocksRoom = (
  app: Pick<App, 'slug'>,
  resourceOwner: Pick<ResourceOwnerSlug, 'slug'>,
) => [resourceOwner.slug, app.slug].join('/');

export const withLiveblocksRoom = (
  children: () => ReactElement,
  {
    room,
    initialStorage,
    initialPresence,
  }: {
    room: string;
    initialStorage?: any;
    initialPresence?: any;
  },
) => (
  <RoomProvider
    id={room}
    initialPresence={initialPresence || {}}
    initialStorage={initialStorage || {}}
  >
    <ClientSideSuspense fallback={<></>}>{children}</ClientSideSuspense>
  </RoomProvider>
);
