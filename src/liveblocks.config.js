import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  authEndpoint: '/api/live/auth',
});

export const { useStorage, RoomProvider, useMutation, useOthers, useSelf } =
  createRoomContext(client);
