import { useOthers, useSelf } from '~/liveblocks.config';

export const useAppEditors = () => {
  const self = useSelf();
  const others = useOthers();

  // Get a list of active people in this app
  const onlineEditorIds = others.map(({ id }) => id as string);
  // put self at the top
  if (self) onlineEditorIds.unshift(self.id as string);
  // now add anyone that's an editor and offline
  const editorIds = [...onlineEditorIds];

  return { editorIds, onlineEditorIds, selfId: self?.id };
};
