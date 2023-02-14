import { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import { createContext, useContext, useEffect, useState } from 'react';
import noop from '~/utils/noop';

import { useStorage as useLiveStorage } from '~/liveblocks.config';

import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';

export type EditorContextType = {
  currentScript: Script | undefined;
  setCurrentScript: (script: Script) => void;
  scripts: Script[];
  setScripts: (scripts: Script[]) => void;
  editor: typeof monaco.editor | undefined;
  setEditor: (editor: typeof monaco.editor) => void;
  isModelDirty: (path: string) => boolean;
  setModelIsDirty: (path: string, isDirty: boolean) => void;
  isEditorDirty: () => boolean;
  save: () => void;
};

export const EditorContext = createContext<EditorContextType>({
  currentScript: undefined,
  setCurrentScript: noop,
  scripts: [],
  setScripts: noop,
  editor: undefined,
  setEditor: noop,
  isModelDirty: () => false,
  setModelIsDirty: noop,
  isEditorDirty: () => false,
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

  const [editor, setEditor] = useState<typeof monaco.editor | undefined>();

  const [modelsDirtyState, setModelsDirtyState] = useState<
    Record<string, boolean>
  >({});

  const currentScriptLive: any = useLiveStorage(
    (root) => root[`script-${currentScript?.id}`],
  );

  useEffect(() => {
    const models = editor?.getModels();
    if (models) {
      const fileModels = models.filter((model) => model.uri.scheme === 'file');
      // if there are more models than scripts, it means we models to dispose of
      fileModels.forEach((model) => {
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
    if (appId && currentScript) {
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

      setModelsDirtyState(
        (Object.keys(modelsDirtyState) as string[]).reduce((acc, elem) => {
          return {
            ...acc,
            [elem]: false,
          };
        }, {} as Record<string, boolean>),
      );
    }
  };

  const isModelDirty = (path: string) => {
    return modelsDirtyState[path] || false;
  };

  const setModelIsDirty = (path: string, isDirty: boolean) => {
    const newModelState = { ...modelsDirtyState };
    newModelState[path] = isDirty;
    setModelsDirtyState(newModelState);
  };

  const isEditorDirty = () => {
    return !!Object.values(modelsDirtyState).find((state) => state);
  };

  return (
    <EditorContext.Provider
      value={{
        currentScript,
        setCurrentScript,
        scripts,
        setScripts,
        editor,
        setEditor,
        isModelDirty,
        setModelIsDirty,
        isEditorDirty,
        save: saveOpenModels,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);

export default EditorContextProvider;
