import { createClient, LiveObject, Room } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
import { type Selection as MonacoSelection } from 'monaco-editor';
import type LiveblocksProvider from '@liveblocks/yjs';

export const client = createClient({
  authEndpoint: '/api/liveblocks/auth',
});

export const getSelectionObject = (s: MonacoSelection) => ({ ...s });
export type Selection = ReturnType<typeof getSelectionObject>;

export type Presence = {
  selection?: ReturnType<typeof getSelectionObject>;
};

export type StoredScriptId = `script-${string}`;
export type Storage = {
  app: LiveObject<{ slug: string; name: string; description: string }>;
  [scriptId: StoredScriptId]: LiveObject<{ code: string }>;
};

export type UserMeta = {
  id: string;
};

export type UserAwareness = {
  user?: UserMeta['id'];
};

export type AwarenessList = [number, UserAwareness][];

// Optionally, the type of custom events broadcast and listened to in this
// room. Use a union for multiple events. Must be JSON-serializable.
export type RoomEvent = {
  // type: "NOTIFICATION",
  // ...
};

export type TypedLiveblocksProvider = LiveblocksProvider<
  Presence,
  Storage,
  UserMeta,
  RoomEvent
>;

export type LiveblocksRoom = Room<Presence, Storage, UserMeta, RoomEvent>;

export const {
  useStorage,
  RoomProvider,
  useMutation,
  useOther,
  useOthers,
  useOthersConnectionIds,
  useSelf,
  useMyPresence,
  useRoom,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
