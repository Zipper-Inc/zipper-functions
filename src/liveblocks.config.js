import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  publicApiKey:
    'pk_dev_WaQ9OrYRc8p-PmBFJeYpLguPZfhANQWyjsLuYYnxKIQxXD8gnJ0VlUYSCW4I3Vwa',
});

export const { useStorage, RoomProvider, useMutation, useOthers, useSelf } =
  createRoomContext(client);
