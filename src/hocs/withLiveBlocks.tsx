import { ReactElement } from 'react';
import { ClientSideSuspense } from '@liveblocks/react';
import { RoomProvider } from '~/liveblocks.config';

export const withLiveBlocks = (
  children: () => ReactElement,
  { id, initialStorage, initialPresence }: any,
) => (
  <RoomProvider
    id={id}
    initialPresence={initialPresence}
    initialStorage={initialStorage}
  >
    <ClientSideSuspense fallback={<div>Loading...</div>}>
      {children}
    </ClientSideSuspense>
  </RoomProvider>
);
