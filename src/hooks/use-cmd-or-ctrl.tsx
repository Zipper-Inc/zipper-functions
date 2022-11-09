import { useHotkeys } from 'react-hotkeys-hook';
import { isMac } from '~/utils/user-agent';

export const useCmdOrCtrl = (
  shortcutKey: string,
  callback: any,
  deps?: any[],
) => {
  const shortcut = `${
    isMac() ? 'command' : 'control'
  }+${shortcutKey.toLowerCase()}`;
  return useHotkeys(
    shortcut,
    callback,
    {
      // enableOnTags: ['INPUT', 'SELECT', 'TEXTAREA'],
      enableOnContentEditable: true,
    },
    deps,
  );
};
