import dynamic from 'next/dynamic';
import { useMutation, useStorage } from '~/liveblocks.config';

export const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

export function LazyEditor({ currentScript, onChange }: any) {
  const currentScriptLive: any = useStorage(
    (root) => root[`script-${currentScript?.id}`],
  );

  const code = currentScriptLive ? currentScriptLive.code : currentScript?.code;

  return Editor ? (
   
  ) : (
    <>loading</>
  );
}
