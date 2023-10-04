import { ReactElement } from 'react';
import { ClientSideSuspense } from '@liveblocks/react';
import { RoomProvider } from '~/liveblocks.config';

export const withLiveBlocks = (
  children: () => ReactElement,
  { room, initialStorage, initialPresence }: any,
) => (
  <RoomProvider
    id={room}
    initialPresence={initialPresence}
    initialStorage={initialStorage}
  >
    <ClientSideSuspense fallback={<></>}>{children}</ClientSideSuspense>
  </RoomProvider>
);
