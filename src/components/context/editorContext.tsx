import { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import { createContext, useEffect, useState } from 'react';
import noop from '~/utils/noop';

import { useStorage as useLiveStorage } from '~/liveblocks.config';

import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';

export type EditorContextType = {
  currentScript: Script | undefined;
  setCurrentScript: (script: Script) => void;
  scripts: Script[];
  setScripts: (scripts: Script[]) => void;
  isUserAnAppEditor: boolean;
  setIsUserAnAppEditor: (isUserAnAppEditor: boolean) => void;
  editor: typeof monaco.editor | undefined;
  setEditor: (editor: typeof monaco.editor) => void;
  save: () => void;
};

export const EditorContext = createContext<EditorContextType>({
  currentScript: undefined,
  setCurrentScript: noop,
  scripts: [],
  setScripts: noop,
  isUserAnAppEditor: false,
  setIsUserAnAppEditor: noop,
  editor: undefined,
  setEditor: noop,
  save: noop,
});

const EditorContextProvider = ({
  children,
  appId,
  initialScripts,
}: {
  children: any;
  appId: string | undefined;
  initialScripts: Script[];
}) => {
  const [currentScript, setCurrentScript] = useState<Script | undefined>(
    undefined,
  );
  const [scripts, setScripts] = useState<Script[]>(initialScripts);

  const [isUserAnAppEditor, setIsUserAnAppEditor] = useState(false);

  const [editor, setEditor] = useState<typeof monaco.editor | undefined>();

  const currentScriptLive: any = useLiveStorage(
    (root) => root[`script-${currentScript?.id}`],
  );

  useEffect(() => {
    const models = editor?.getModels();
    if (models) {
      // if there are more models than scripts, it means we models to dispose of
      models.forEach((model) => {
        // if the model is not in the scripts, dispose of it
        if (
          !scripts.find((script) => `/${script.filename}` === model.uri.path)
        ) {
          // if the model is the script that has been deleted, set the current script to the first script
          if (`/${currentScript?.filename}` === model.uri.path) {
            setCurrentScript(scripts[0]);
          }
          model.dispose();
        }
      });
    }
  }, [scripts]);

  const router = useRouter();
  useEffect(() => {
    if (currentScript) {
      if (router.query.filename !== currentScript.filename) {
        router.push(
          {
            pathname: '/app/[id]/edit/[filename]',
            query: { id: appId, filename: currentScript?.filename },
          },
          undefined,
          { shallow: true },
        );
      }
    }
  }, [currentScript]);

  const utils = trpc.useContext();

  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      if (appId) {
        await utils.invalidateQueries(['app.byId', { id: appId }]);
      }
    },
  });

  const saveOpenModels = () => {
    if (isUserAnAppEditor && appId && currentScript) {
      const fileValues: Record<string, string> = {};

      editor?.getModels().map((model) => {
        if (model.uri.scheme === 'file') {
          fileValues[model.uri.path] = model.getValue();
        }
      });

      editAppMutation.mutateAsync({
        id: appId,
        data: {
          scripts: scripts.map((script: any) => ({
            id: script.id,
            data:
              script.id === currentScript.id
                ? {
                    name: currentScriptLive?.name || script.name,
                    description:
                      currentScriptLive?.description || script.description,
                    code: fileValues[`/${script.filename}`],
                  }
                : {
                    name: script.name,
                    description: script.description || '',
                    code: fileValues[`/${script.filename}`],
                  },
          })),
        },
      });
    }
  };

  return (
    <EditorContext.Provider
      value={{
        currentScript,
        setCurrentScript,
        scripts,
        setScripts,
        isUserAnAppEditor,
        setIsUserAnAppEditor,
        editor,
        setEditor,
        save: saveOpenModels,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export default EditorContextProvider;
