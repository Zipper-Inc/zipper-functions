import { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import { EditorProps, Monaco } from '@monaco-editor/react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  MutableRefObject,
} from 'react';
import noop, { asyncNoop } from '~/utils/noop';

import {
  useSelf,
  useStorage as useLiveStorage,
  useMutation as useLiveMutation,
} from '~/liveblocks.config';

import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';
import { LiveObject, LsonObject } from '@liveblocks/client';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';
import { InputParam } from '@zipper/types';
import { parseCode } from '~/utils/parse-code';
import debounce from 'lodash.debounce';
import { uuid } from '@zipper/utils';
import { prettyLog } from '~/utils/pretty-log';
import { AppQueryOutput } from '~/types/trpc';
import { getAppVersionFromHash } from '~/utils/hashing';

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
  save: () => Promise<void | string | null | undefined>;
  refetchApp: VoidFunction;
  replaceCurrentScriptCode: (code: string) => void;
  inputParams?: InputParam[];
  setInputParams: (inputParams: InputParam[]) => void;
  inputError?: string;
  monacoRef?: MutableRefObject<Monaco | undefined>;
  logs: Zipper.Log.Message[];
  preserveLogs: boolean;
  setPreserveLogs: (v: boolean) => void;
  addLog: (method: Zipper.Log.Method, data: Zipper.Serializable[]) => void;
  setLogStore: (
    cb: (
      n: Record<string, Zipper.Log.Message[]>,
    ) => Record<string, Zipper.Log.Message[]>,
  ) => void;
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
  inputParams: undefined,
  setInputParams: noop,
  inputError: undefined,
  monacoRef: undefined,
  logs: [],
  preserveLogs: true,
  setPreserveLogs: noop,
  addLog: noop,
  setLogStore: noop,
});

const MAX_RETRIES_FOR_EXTERNAL_IMPORT = 3;
const DEBOUNCE_DELAY_MS = 250;

/**
 * Fetches an import and modifies refs as needed
 * specific to Editor Context
 * Recursively calls itself on error up to N times
 */
async function fetchImport({
  importUrl,
  uriParser,
  monacoRef,
  invalidImportUrlsRef,
}: {
  importUrl: string;
  uriParser: (value: string, _strict?: boolean | undefined) => monaco.Uri;
  monacoRef: MutableRefObject<typeof monaco | undefined>;
  invalidImportUrlsRef: MutableRefObject<{ [url: string]: number }>;
}) {
  // Don't try to fetch something we've already marked as invalid
  if ((invalidImportUrlsRef.current[importUrl] || 0) >= 3) return;

  try {
    console.log('[IMPORTS]', `(${importUrl})`, 'Fetching import');

    // Grab the bundle (or bundle of types)
    const bundle = await fetch(`/api/ts/bundle?x=${importUrl}`).then((r) =>
      r.json(),
    );

    // Add each individual file in the bundle the model
    Object.keys(bundle).forEach((url) => {
      console.log('[IMPORTS]', `(${importUrl})`, `Handling ${url}`);
      const src = bundle[url];
      const uri = getUriFromPath(url, uriParser);
      if (!monacoRef?.current?.editor.getModel(uri)) {
        monacoRef?.current?.editor.createModel(src, 'typescript', uri);
      }
    });
  } catch (e) {
    let currentRetries = invalidImportUrlsRef.current[importUrl] || 0;
    invalidImportUrlsRef.current[importUrl] = currentRetries += 1;
    console.error(
      '[IMPORTS]',
      `(${importUrl})`,
      `Error adding import, will try ${
        MAX_RETRIES_FOR_EXTERNAL_IMPORT - currentRetries
      } more times`,
      e,
    );

    // Retry this N more times with exponential backoff
    window.setTimeout(
      () =>
        fetchImport({
          importUrl,
          uriParser,
          monacoRef,
          invalidImportUrlsRef,
        }),
      currentRetries ** 2 * 1000,
    );
  }
}

function handleExternalImports({
  imports,
  monacoRef,
  externalImportModelsRef,
  invalidImportUrlsRef,
}: {
  imports: string[];
  monacoRef: MutableRefObject<typeof monaco | undefined>;
  externalImportModelsRef: MutableRefObject<string[]>;
  invalidImportUrlsRef: MutableRefObject<{ [url: string]: number }>;
}) {
  if (!monacoRef?.current) return;

  const uriParser = monacoRef.current.Uri.parse;

  const oldImportModels = externalImportModelsRef.current;
  const newImportModels: string[] = [];

  // First, let's cleanup anything removed from the code
  oldImportModels.forEach((importUrl) => {
    const modelToDelete =
      !imports.includes(importUrl) &&
      monacoRef?.current?.editor.getModel(getUriFromPath(importUrl, uriParser));

    // @todo figure out how to remove other models in the bundle
    // Here we're just removing the root one
    if (modelToDelete) {
      console.log('[IMPORTS]', `Removing ${importUrl}`);
      modelToDelete.dispose();
    }
  });

  // Handle changes in code
  imports.forEach((importUrl, index) => {
    // First let's move the pointer to the right spot
    newImportModels[index] = importUrl;

    // Code matches what we have models for, do nothing
    if (importUrl === oldImportModels[index]) return;

    // If this is net new and not already invalid, let's download it
    if (
      !externalImportModelsRef.current.includes(importUrl) &&
      (invalidImportUrlsRef.current[importUrl] || 0) <
        MAX_RETRIES_FOR_EXTERNAL_IMPORT
    ) {
      fetchImport({
        importUrl,
        uriParser,
        monacoRef,
        invalidImportUrlsRef,
      });
    }
  });

  externalImportModelsRef.current = newImportModels;
}

const handleExternalImportsDebounced = debounce(
  handleExternalImports,
  DEBOUNCE_DELAY_MS,
);

const EditorContextProvider = ({
  app,
  children,
  appId,
  appSlug,
  resourceOwnerSlug,
  initialScripts,
  refetchApp,
}: {
  app: AppQueryOutput;
  children: any;
  appId: string | undefined;
  appSlug: string | undefined;
  resourceOwnerSlug: string | undefined;
  initialScripts: Script[];
  refetchApp: () => Promise<void>;
}) => {
  const [currentScript, setCurrentScript] = useState<Script | undefined>(
    undefined,
  );

  const [inputParams, setInputParams] = useState<InputParam[] | undefined>([]);
  const [inputError, setInputError] = useState<string | undefined>();

  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [isSaving, setIsSaving] = useState(false);

  const [editor, setEditor] = useState<typeof monaco.editor | undefined>();
  const monacoRef = useRef<Monaco>();

  const invalidImportUrlsRef = useRef<{ [url: string]: number }>({});
  const externalImportModelsRef = useRef<string[]>([]);

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

      if (!stored) {
        storage.set(
          `script-${currentScript?.id}`,
          new LiveObject<LsonObject>({
            code: newCode,
            lastLocalVersion: newVersion,
            lastConnectionId: self.connectionId,
          }),
        );
        return;
      }

      if (!stored || stored.get('code') === newCode) return;

      stored.set('code', newCode);
      stored.set('lastLocalVersion', newVersion);
      stored.set('lastConnectionId', self.connectionId);
    },
    [currentScript],
  );

  const onChange: EditorProps['onChange'] = (value = '', event) => {
    try {
      localStorage.setItem(`script-${currentScript?.id}`, value);
      mutateLive(value, event.versionId);

      try {
        const { inputs, imports } = parseCode({
          code: value,
          throwErrors: true,
        });

        setInputParams(inputs);
        setInputError(undefined);

        handleExternalImportsDebounced({
          imports,
          monacoRef,
          externalImportModelsRef,
          invalidImportUrlsRef,
        });
      } catch (e: any) {
        setInputParams(undefined);
        setInputError(e.message);
      }
    } catch (e) {
      console.error('Caught error from mutateLive:', e);
    }
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
      try {
        const { inputs } = parseCode({
          code: currentScriptLive?.code || currentScript.code,
          throwErrors: true,
        });

        setInputParams(inputs);
        setInputError(undefined);
      } catch (e: any) {
        setInputParams(undefined);
        setInputError(e.message);
      }

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

  // LOGS
  const [preserveLogs, setPreserveLogs] = useState(true);
  const [logs, setLogs] = useState<Zipper.Log.Message[]>([]);
  const [logStore, setLogStore] = useState<
    Record<string, Zipper.Log.Message[]>
  >({});

  useEffect(() => {
    const newLogs: Zipper.Log.Message[] = [];
    setLogs(
      newLogs
        .concat(...Object.values(logStore))
        .sort((a, b) => a.timestamp - b.timestamp),
    );
  }, [logStore]);

  const addLog = (method: Zipper.Log.Method, data: Zipper.Serializable[]) => {
    const newLog = {
      id: uuid(),
      method,
      data,
      timestamp: Date.now(),
    };

    setLogStore((prev) => {
      const local = prev.local || [];
      local.push(newLog);
      return { ...prev, local };
    });
  };
  // END LOGS

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
      const version = getAppVersionFromHash(app.hash || '');
      addLog(
        'info',
        prettyLog({
          topic: 'Save',
          subtopic: `${appSlug}@${version}`,
          badge: 'Pending',
        }),
      );

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

      const newApp = await editAppMutation.mutateAsync({
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

      refetchApp();
      setIsSaving(false);

      const newVersion = getAppVersionFromHash(newApp.hash || '');
      addLog(
        'info',
        prettyLog({
          topic: 'Save',
          subtopic: `${appSlug}@${newVersion}`,
          badge: 'Done',
          msg:
            newVersion !== version
              ? 'You saved a new version.'
              : 'No changes, the version is the same.',
        }),
      );

      return newApp.hash;
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
        inputParams,
        setInputParams,
        inputError,
        monacoRef,
        logs,
        addLog,
        setLogStore,
        preserveLogs,
        setPreserveLogs,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);

export default EditorContextProvider;
