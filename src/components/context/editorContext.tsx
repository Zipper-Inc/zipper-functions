import { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import { createContext, useState } from 'react';
import noop from '~/utils/noop';
import { LiveObject, LsonObject } from '@liveblocks/client';
import debounce from 'lodash.debounce';

import { InputParam } from '~/types/input-params';

import {
  useMutation as useLiveMutation,
  useStorage as useLiveStorage,
} from '~/liveblocks.config';

import usePrettier from '~/hooks/use-prettier';
import { parseInputForTypes } from '../app/parse-input-for-types';
import { trpc } from '~/utils/trpc';

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
  removeEditorModel: (model: monaco.editor.ITextModel) => void;
  renameEditorModel: (uri: monaco.Uri, newUri: monaco.Uri) => void;
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
  removeEditorModel: noop,
  renameEditorModel: noop,
});

const EditorContextProvider = ({
  children,
  appId,
}: {
  children: any;
  appId: string | undefined;
}) => {
  const [currentScript, setCurrentScript] = useState<Script | undefined>(
    undefined,
  );
  const [scripts, setScripts] = useState<Script[]>([]);

  const [isUserAnAppEditor, setIsUserAnAppEditor] = useState(false);

  const [editor, setEditor] = useState<typeof monaco.editor | undefined>();

  const currentScriptLive: any = useLiveStorage(
    (root) => root[`script-${currentScript?.id}`],
  );

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
                    name: currentScriptLive.name || script.name,
                    description:
                      currentScriptLive.description || script.description,
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
        removeEditorModel: () => {},
        renameEditorModel: () => {},
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export default EditorContextProvider;
