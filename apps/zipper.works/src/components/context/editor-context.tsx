import { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import { EditorProps } from '@monaco-editor/react';
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
import { getAppHash } from '~/utils/hashing';
import { getPathFromUri } from '~/utils/model-uri';

export type EditorContextType = {
  currentScript?: Script;
  setCurrentScript: (script: Script) => void;
  currentScriptLive?: {
    code: string;
    lastLocalVersion: number;
    lastConnectionId: number;
  };
  onChange: EditorProps['onChange'];
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
  refetchApp: VoidFunction;
  replaceCurrentScriptCode: (code: string) => void;
};

export const EditorContext = createContext<EditorContextType>({
  currentScript: undefined,
  setCurrentScript: noop,
  currentScriptLive: undefined,
  onChange: noop,
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
  refetchApp: noop,
  replaceCurrentScriptCode: noop,
});

const EditorContextProvider = ({
  children,
  appId,
  appSlug,
  resourceOwnerSlug,
  initialScripts,
  refetchApp,
}: {
  children: any;
  appId: string | undefined;
  appSlug: string | undefined;
  resourceOwnerSlug: string | undefined;
  initialScripts: Script[];
  refetchApp: VoidFunction;
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

  const onChange: EditorProps['onChange'] = (value = '', event) => {
    try {
      mutateLive(value, event.versionId);
    } catch (e) {
      console.error('Caught error from mutateLive:', e);
    }

    localStorage.setItem(`script-${currentScript?.id}`, value);
  };

  useEffect(() => {
    const models = editor?.getModels();
    if (models) {
      const fileModels = models.filter((model) => model.uri.scheme === 'file');
      // if there are more models than scripts, it means we models to dispose of
      fileModels.forEach((model) => {
        // if the model is not in the scripts, dispose of it
        if (
          !scripts.find(
            (script) => `/${script.filename}` === getPathFromUri(model.uri),
          )
        ) {
          // if the model is the script that has been deleted, set the current script to the first script
          if (`/${currentScript?.filename}` === getPathFromUri(model.uri)) {
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

  useEffect(() => {
    setScripts(initialScripts);
  }, [initialScripts]);

  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      refetchApp();
    },
  });

  const self = useSelf();

  const replaceCurrentScriptCode = (code: string) => {
    if (currentScript) {
      setCurrentScript({ ...currentScript, code });
      const models = editor?.getModels();
      if (models) {
        const fileModels = models.filter(
          (model) => model.uri.scheme === 'file',
        );
        fileModels.forEach((model) => {
          if (
            `/${currentScript.filename}` === getPathFromUri(model.uri) &&
            model.getValue() !== currentScript.code
          ) {
            model.setValue(currentScript.code);
            // Call mutateLive and localStorage.setItem when the currentScript is updated
            try {
              mutateLive(currentScript.code, model.getVersionId());
            } catch (e) {
              console.error('Caught error from mutateLive:', e);
            }
            localStorage.setItem(
              `script-${currentScript.id}`,
              currentScript.code,
            );
          }
        });
      }
    }
  };

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
          // Strip the extra '.ts' that's required by intellisense
          fileValues[getPathFromUri(model.uri)] = model.getValue();
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
            data: {
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
        onChange,
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
        refetchApp,
        replaceCurrentScriptCode,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);

export default EditorContextProvider;
