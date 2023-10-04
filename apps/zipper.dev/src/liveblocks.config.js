import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  authEndpoint: '/api/liveblocks/auth',
});

export const {
  useStorage,
  RoomProvider,
  useMutation,
  useOther,
  useOthers,
  useOthersConnectionIds,
  useSelf,
  useMyPresence,
} = createRoomContext(client);
