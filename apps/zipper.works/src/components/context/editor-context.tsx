import { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import { createContext, useContext, useEffect, useState } from 'react';
import noop, { asyncNoop } from '~/utils/noop';

import {
  useSelf,
  useStorage as useLiveStorage,
  useMutation as useLiveMutation,
} from '~/liveblocks.config';

import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';
import { LiveObject, LsonObject } from '@liveblocks/client';

export type EditorContextType = {
  currentScript?: Script;
  setCurrentScript: (script: Script) => void;
  currentScriptLive?: {
    code: string;
    lastLocalVersion: number;
    lastConnectionId: number;
  };
  mutateLive: (newCode: string, newVersion: number) => void;
  connectionId?: number;
  scripts: Script[];
  setScripts: (scripts: Script[]) => void;
  editor?: typeof monaco.editor;
  setEditor: (editor: typeof monaco.editor) => void;
  isModelDirty: (path: string) => boolean;
  setModelIsDirty: (path: string, isDirty: boolean) => void;
  isEditorDirty: () => boolean;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  save: () => Promise<void>;
};

export const EditorContext = createContext<EditorContextType>({
  currentScript: undefined,
  setCurrentScript: noop,
  currentScriptLive: undefined,
  mutateLive: noop,
  connectionId: undefined,
  scripts: [],
  setScripts: noop,
  editor: undefined,
  setEditor: noop,
  isModelDirty: () => false,
  setModelIsDirty: noop,
  isEditorDirty: () => false,
  isSaving: false,
  setIsSaving: noop,
  save: asyncNoop,
});

const EditorContextProvider = ({
  children,
  appId,
  appSlug,
  resourceOwnerSlug,
  initialScripts,
}: {
  children: any;
  appId: string | undefined;
  appSlug: string | undefined;
  resourceOwnerSlug: string | undefined;
  initialScripts: Script[];
}) => {
  const [currentScript, setCurrentScript] = useState<Script | undefined>(
    undefined,
  );
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [isSaving, setIsSaving] = useState(false);

  const [editor, setEditor] = useState<typeof monaco.editor | undefined>();

  const [modelsDirtyState, setModelsDirtyState] = useState<
    Record<string, boolean>
  >({});

  const currentScriptLive: any = useLiveStorage(
    (root) => root[`script-${currentScript?.id}`],
  );

  const mutateLive = useLiveMutation(
    (context, newCode: string, newVersion: number) => {
      const { storage, self } = context;

      const stored = storage.get(
        `script-${currentScript?.id}`,
      ) as LiveObject<LsonObject>;

      if (!stored || stored.get('code') === newCode) return;

      stored.set('code', newCode);
      stored.set('lastLocalVersion', newVersion);
      stored.set('lastConnectionId', self.connectionId);
    },
    [currentScript],
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
            pathname: '/[resource-owner]/[app-slug]/edit/[filename]',
            query: {
              'app-slug': appSlug,
              'resource-owner': resourceOwnerSlug,
              filename: currentScript?.filename,
            },
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

  const self = useSelf();

  const saveOpenModels = async () => {
    if (appId && currentScript) {
      setIsSaving(true);

      const formatPromises = editor
        ?.getEditors()
        .map((e) => e.getAction('editor.action.formatDocument')?.run());

      if (formatPromises && formatPromises.length)
        await Promise.all(formatPromises).catch();

      const fileValues: Record<string, string> = {};

      editor?.getModels().map((model) => {
        if (model.uri.scheme === 'file') {
          fileValues[model.uri.path] = model.getValue();
        }
      });

      setModelsDirtyState(
        (Object.keys(modelsDirtyState) as string[]).reduce((acc, elem) => {
          return {
            ...acc,
            [elem]: false,
          };
        }, {} as Record<string, boolean>),
      );

      await editAppMutation.mutateAsync({
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

      setIsSaving(false);
    }
  };

  const isModelDirty = (path: string) => {
    return modelsDirtyState[path] || false;
  };

  const setModelIsDirty = (path: string, isDirty: boolean) => {
    setModelsDirtyState((previousModelsDirtyState) => {
      const newModelState = { ...previousModelsDirtyState };
      newModelState[path] = isDirty;
      return newModelState;
    });
  };

  const isEditorDirty = () => {
    return !!Object.values(modelsDirtyState).find((state) => state);
  };

  return (
    <EditorContext.Provider
      value={{
        currentScript,
        setCurrentScript,
        currentScriptLive,
        mutateLive,
        connectionId: self?.connectionId,
        scripts,
        setScripts,
        editor,
        setEditor,
        isModelDirty,
        setModelIsDirty,
        isEditorDirty,
        isSaving,
        setIsSaving,
        save: saveOpenModels,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);

export default EditorContextProvider;
