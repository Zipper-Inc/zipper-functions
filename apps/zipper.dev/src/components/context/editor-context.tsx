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
import noop from '~/utils/noop';

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
import { isExternalImport, parseCode } from '~/utils/parse-code';
import debounce from 'lodash.debounce';
import { uuid } from '@zipper/utils';
import { prettyLog } from '~/utils/pretty-log';
import { AppQueryOutput } from '~/types/trpc';
import { getAppVersionFromHash, getScriptHash } from '~/utils/hashing';
import { isZipperImportUrl } from '~/utils/eszip-utils';
import { parsePlaygroundQuery, PlaygroundTab } from '~/utils/playground.utils';
import { runZipperLinter } from '~/utils/zipper-editor-linter';
import { rewriteSpecifier } from '~/utils/rewrite-imports';
import { rest } from 'lodash';

type OnValidate = AddParameters<
  Required<EditorProps>['onValidate'],
  [filename?: string]
>;

type RunEditorActionsInputs = Parameters<typeof runEditorActionsNow>[0];

export type EditorContextType = {
  currentScript?: Script;
  setCurrentScript: (script: Script) => void;
  currentScriptLive?: {
    code: string;
    lastLocalVersion: number;
    lastConnectionId: number;
  };
  onChange: EditorProps['onChange'];
  onValidate: OnValidate;
  connectionId?: number;
  scripts: Script[];
  setScripts: (scripts: Script[]) => void;
  editor?: typeof monaco.editor;
  setEditor: (editor: typeof monaco.editor) => void;
  isModelDirty: (path: string) => boolean;
  setModelIsDirty: (path: string, isDirty: boolean) => void;
  isEditorDirty: () => boolean;
  modelHasErrors: (path: string) => boolean;
  setModelHasErrors: (path: string, isErroring: boolean) => void;
  editorHasErrors: () => boolean;
  getErrorFiles: () => string[];
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  save: () => Promise<string>;
  refetchApp: () => Promise<void>;
  replaceCurrentScriptCode: (code: string) => void;
  inputParams?: InputParam[];
  setInputParams: (inputParams?: InputParam[]) => void;
  inputError?: string;
  monacoRef?: MutableRefObject<Monaco | undefined>;
  logs: Zipper.Log.Message[];
  lastReadLogsTimestamp: number;
  preserveLogs: boolean;
  setPreserveLogs: (v: boolean) => void;
  addLog: (method: Zipper.Log.Method, data: Zipper.Serializable[]) => void;
  markLogsAsRead: () => void;
  setLogStore: (
    cb: (
      n: Record<string, Zipper.Log.Message[]>,
    ) => Record<string, Zipper.Log.Message[]>,
  ) => void;
  resourceOwnerSlug: string;
  appSlug: string;
  runEditorActions:
    | typeof noop
    | ((
        inputs: Pick<RunEditorActionsInputs, 'value' | 'currentScript'> & {
          now?: boolean;
        },
        defaults?: RunEditorActionsInputs,
      ) => Promise<void>);
  readOnly: boolean;
};

export const EditorContext = createContext<EditorContextType>({
  currentScript: undefined,
  setCurrentScript: noop,
  currentScriptLive: undefined,
  onChange: noop,
  onValidate: noop,
  connectionId: undefined,
  scripts: [],
  setScripts: noop,
  editor: undefined,
  setEditor: noop,
  isModelDirty: () => false,
  setModelIsDirty: noop,
  isEditorDirty: () => false,
  modelHasErrors: () => false,
  setModelHasErrors: () => false,
  editorHasErrors: () => false,
  getErrorFiles: () => [],
  isSaving: false,
  setIsSaving: noop,
  save: async () => {
    return '';
  },
  refetchApp: async () => {
    return;
  },
  replaceCurrentScriptCode: noop,
  inputParams: undefined,
  setInputParams: noop,
  inputError: undefined,
  monacoRef: undefined,
  logs: [],
  preserveLogs: true,
  lastReadLogsTimestamp: 0,
  setPreserveLogs: noop,
  addLog: noop,
  markLogsAsRead: noop,
  setLogStore: noop,
  resourceOwnerSlug: '',
  appSlug: '',
  runEditorActions: noop,
  readOnly: false,
});

const MAX_RETRIES_FOR_EXTERNAL_IMPORT = 3;
const DEBOUNCE_DELAY_MS = 100;

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
  alias,
}: {
  importUrl: string;
  uriParser: (value: string, _strict?: boolean | undefined) => monaco.Uri;
  monacoRef: MutableRefObject<typeof monaco | undefined>;
  invalidImportUrlsRef: MutableRefObject<{ [url: string]: number }>;
  alias?: string;
}) {
  if (!monacoRef?.current) return;

  // Don't try to fetch something we've already marked as invalid
  if ((invalidImportUrlsRef.current[importUrl] || 0) >= 3) return;

  try {
    console.log('[IMPORTS]', `(${importUrl})`, 'Fetching import');

    // Grab the bundle (or bundle of types)
    const bundle = await fetch(`/api/editor/ts/bundle?x=${importUrl}`).then(
      (r) => r.json(),
    );

    // Add each individual file in the bundle the model
    Object.keys(bundle).forEach((url) => {
      if (!monacoRef?.current) return;
      console.log('[IMPORTS]', `(${importUrl})`, `Handling ${url}`);
      const src = bundle[url];
      const uri = getUriFromPath(
        url,
        uriParser,
        isZipperImportUrl(url) || url.endsWith('tsx') ? 'tsx' : 'ts',
      );

      if (!monacoRef.current.editor.getModel(uri)) {
        monacoRef.current.editor.createModel(src, 'typescript', uri);
        // this crazy shit does the aliasing
        // works like a reducer to update the paths object in compilerOptions
        if (alias) {
          const opts =
            monacoRef.current.languages.typescript.typescriptDefaults.getCompilerOptions();
          monacoRef.current.languages.typescript.typescriptDefaults.setCompilerOptions(
            {
              ...opts,
              paths: {
                ...opts.paths,
                [alias]: [url],
              },
            },
          );
        }
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
    return new Promise((resolve) =>
      window.setTimeout(
        () =>
          fetchImport({
            importUrl,
            uriParser,
            monacoRef,
            invalidImportUrlsRef,
          }).then(resolve),
        currentRetries ** 2 * 1000,
      ),
    );
  }
}

async function handleExternalImports({
  imports,
  monacoRef,
  externalImportModelsRef,
  invalidImportUrlsRef,
  currentScript,
}: {
  imports: { specifier: string }[];
  monacoRef: MutableRefObject<typeof monaco | undefined>;
  externalImportModelsRef: MutableRefObject<Record<string, string[]>>;
  invalidImportUrlsRef: MutableRefObject<{ [url: string]: number }>;
  currentScript?: Script;
}) {
  if (!monacoRef?.current || !currentScript || !externalImportModelsRef.current)
    return;

  const externalImportsPairs = imports
    .map((i) => [i.specifier, rewriteSpecifier(i.specifier)] as const)
    .filter((s) => isExternalImport(s[1]));

  const externalImports = externalImportsPairs.map((s) => s[1]);

  const uriParser = monacoRef.current.Uri.parse;

  const externalImportsForThisFile =
    externalImportModelsRef.current[currentScript.filename] || [];
  const oldImportModels = externalImportsForThisFile;
  const newImportModels: string[] = [];

  // First, let's cleanup anything removed from the code
  oldImportModels.forEach((importUrl) => {
    const modelToDelete =
      !externalImports.includes(importUrl) &&
      monacoRef?.current?.editor.getModel(
        getUriFromPath(
          importUrl,
          uriParser,
          importUrl.endsWith('tsx') ? 'tsx' : 'ts',
        ),
      );

    // @todo figure out how to remove other models in the bundle
    // Here we're just removing the root one
    if (modelToDelete) {
      console.log('[IMPORTS]', `Removing ${importUrl}`);
      modelToDelete.dispose();
    }
  });

  // Handle changes in code
  await Promise.all(
    externalImports.map(async (importUrl, index) => {
      // First let's move the pointer to the right spot
      newImportModels[index] = importUrl;

      if (importUrl === oldImportModels[index]) return;

      if (externalImportsForThisFile.includes(importUrl)) return;

      const currentRetries = invalidImportUrlsRef.current[importUrl] || 0;
      if (currentRetries >= MAX_RETRIES_FOR_EXTERNAL_IMPORT) return;

      // check if we have an alias
      const alias = externalImportsPairs.find(
        ([ogSpecifier, rewrittenSpecifier]) =>
          rewrittenSpecifier === importUrl &&
          ogSpecifier !== rewrittenSpecifier,
      )?.[0];

      return fetchImport({
        importUrl,
        uriParser,
        monacoRef,
        invalidImportUrlsRef,
        alias: alias !== importUrl ? alias : undefined,
      }).catch((e) => {
        console.error('Unhandled error in while fetching import', e);
      });
    }),
  );

  externalImportModelsRef.current[currentScript.filename] = newImportModels;
}

async function runEditorActionsNow({
  value,
  setInputParams,
  setInputError: setInputErrorPassedIn,
  monacoRef,
  currentScript,
  externalImportModelsRef,
  invalidImportUrlsRef,
  setModelIsDirty: setModelIsDirtyPassedIn,
  readOnly,
}: {
  value: string;
  setInputParams: EditorContextType['setInputParams'];
  setInputError: (error: string | undefined) => void;
  monacoRef: MutableRefObject<typeof monaco | undefined>;
  currentScript: Script;
  externalImportModelsRef: MutableRefObject<Record<string, string[]>>;
  invalidImportUrlsRef: MutableRefObject<{ [url: string]: number }>;
  setModelIsDirty: (path: string, isDirty: boolean) => void;
  readOnly: boolean;
}) {
  if (!monacoRef.current) return;

  const setInputError = readOnly ? noop : setInputErrorPassedIn;
  const setModelIsDirty = readOnly ? noop : setModelIsDirtyPassedIn;
  const linter = readOnly ? noop : runZipperLinter;

  try {
    const newHash = getScriptHash({ ...currentScript, code: value });
    setModelIsDirty(currentScript.filename, newHash !== currentScript.hash);

    const { inputs, imports } = parseCode({
      code: value,
      throwErrors: true,
    });

    setInputParams(inputs);
    setInputError(undefined);

    linter({
      imports,
      monacoRef,
      currentScript,
      externalImportModelsRef,
      invalidImportUrlsRef,
    });

    await handleExternalImports({
      imports,
      monacoRef,
      externalImportModelsRef,
      invalidImportUrlsRef,
      currentScript,
    });
  } catch (e: any) {
    setInputParams(undefined);
    setInputError(e.message);
  }
}

const runEditorActionsDebounced = debounce(
  runEditorActionsNow,
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
  readOnly,
}: {
  app: AppQueryOutput;
  children: any;
  appId: string | undefined;
  appSlug: string | undefined;
  resourceOwnerSlug: string | undefined;
  initialScripts: Script[];
  refetchApp: () => Promise<void>;
  readOnly: boolean;
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
  const externalImportModelsRef = useRef<Record<string, string[]>>({});

  const [modelsDirtyState, setModelsDirtyState] = useState<
    Record<string, boolean>
  >({});

  const [modelsErrorState, setModelsErrorState] = useState<
    Record<string, boolean>
  >({});

  // liveblocks here
  const currentScriptLive: any = useLiveStorage(
    (root) => root[`script-${currentScript?.id}`],
  );

  const onChange: EditorProps['onChange'] = async (value = '', event) => {
    if (!monacoRef?.current || !currentScript) return;
    runEditorActionsDebounced({
      value,
      setInputParams,
      setInputError,
      monacoRef,
      currentScript,
      externalImportModelsRef,
      invalidImportUrlsRef,
      setModelIsDirty,
      readOnly,
    });
  };

  const onValidate: EditorProps['onValidate'] = (
    markers,
    filename = currentScript?.filename,
  ) => {
    if (!filename) return;
    const errorMarker = markers?.find(
      (m) => m.severity === monacoRef.current?.MarkerSeverity.Error,
    );
    setModelHasErrors(filename, !!errorMarker);
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

      const { tab: playgroundTab, filename: playgroundFilename } =
        parsePlaygroundQuery(router.query);

      if (
        playgroundTab === PlaygroundTab.Code &&
        playgroundFilename !== currentScript.filename
      ) {
        router.push(
          {
            pathname: '/[resource-owner]/[app-slug]/[...playground]',
            query: {
              'app-slug': appSlug,
              'resource-owner': resourceOwnerSlug,
              playground: [PlaygroundTab.Code, currentScript?.filename],
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

  const editAppMutation = trpc.app.edit.useMutation({
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
  const [lastReadLogsTimestamp, setLastReadLogsTimestamp] = useState<number>(0);

  useEffect(() => {
    const newLogs: Zipper.Log.Message[] = [];
    // add a timestamp for the last time the logs was read
    setLogs(
      newLogs
        .concat(...Object.values(logStore))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    );
  }, [logStore]);

  const addLog = (method: Zipper.Log.Method, data: Zipper.Serializable[]) => {
    const newLog = {
      id: uuid(),
      method,
      data,
      timestamp: new Date(),
    };

    setLogStore((prev) => {
      const local = prev.local || [];
      local.push(newLog);
      return { ...prev, local };
    });
  };

  const markLogsAsRead = () => {
    setLastReadLogsTimestamp(Date.now());
  };

  /** todo test */
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
          }
        });
      }
    }
  };

  const saveOpenModels = async () => {
    if (!appId || !currentScript)
      throw new Error('Something went wrong while saving');

    setIsSaving(true);
    const version = getAppVersionFromHash(app.playgroundVersionHash);
    addLog(
      'info',
      prettyLog({
        badge: 'Save',
        topic: `${appSlug}@${version}`,
        subtopic: 'Pending',
      }),
    );

    try {
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
              filename: script.filename,
            },
          })),
        },
      });
      refetchApp();
      setIsSaving(false);

      if (!newApp.playgroundVersionHash) {
        throw new Error('Something went wrong while saving the applet');
      }

      const newVersion = getAppVersionFromHash(newApp.playgroundVersionHash);
      addLog(
        'info',
        prettyLog({
          badge: 'Save',
          topic: `${appSlug}@${newVersion}`,
          subtopic: 'Done',
          msg:
            newVersion !== version
              ? 'You saved a new version.'
              : 'No changes, the version is the same.',
        }),
      );

      return newApp.playgroundVersionHash;
    } catch (e: any) {
      setIsSaving(false);
      addLog(
        'error',
        prettyLog({
          badge: 'SAVE',
          topic: `${appSlug}@${version}`,
          subtopic: 'ERROR',
          msg: e.toString(),
        }),
      );
      throw new Error(e);
    }
  };

  const isModelDirty = (path: string) => {
    return modelsDirtyState[path] || false;
  };

  const setModelIsDirty = (path: string, isDirty: boolean) => {
    if (path === 'types/zipper.d') return;
    setModelsDirtyState((previousModelsDirtyState) => {
      const newModelState = { ...previousModelsDirtyState };
      newModelState[path] = isDirty;
      return newModelState;
    });
  };

  const isEditorDirty = () => {
    return !!Object.values(modelsDirtyState).find((state) => state);
  };

  const modelHasErrors = (path: string) => {
    return modelsErrorState[path] || false;
  };

  const setModelHasErrors = (path: string, hasErrors: boolean) => {
    if (path === 'types/zipper.d') return;
    setModelsErrorState((previousModelErrorState) => {
      const newModelState = { ...previousModelErrorState };
      newModelState[path] = hasErrors;
      return newModelState;
    });
  };

  const editorHasErrors = () => {
    return !!Object.values(modelsErrorState).find((state) => state);
  };

  const getErrorFiles = () =>
    Object.entries(modelsErrorState)
      .filter(([, value]) => value)
      .map(([filename]) => filename);

  return (
    <EditorContext.Provider
      value={{
        currentScript,
        setCurrentScript,
        currentScriptLive,
        onChange,
        onValidate,
        connectionId: self?.connectionId,
        scripts,
        setScripts,
        editor,
        setEditor,
        isModelDirty,
        setModelIsDirty,
        isEditorDirty,
        modelHasErrors,
        setModelHasErrors,
        editorHasErrors,
        getErrorFiles,
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
        markLogsAsRead,
        preserveLogs,
        setPreserveLogs,
        lastReadLogsTimestamp,
        resourceOwnerSlug: resourceOwnerSlug as string,
        appSlug: appSlug as string,
        runEditorActions: async (
          { now = false, currentScript, value },
          defaults = {
            value: '',
            currentScript: {} as any,
            setInputParams,
            setInputError,
            monacoRef,
            externalImportModelsRef,
            invalidImportUrlsRef,
            setModelIsDirty,
            readOnly,
          },
        ) =>
          (now ? runEditorActionsNow : runEditorActionsDebounced)({
            ...defaults,
            currentScript,
            value,
          }),
        readOnly,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);
export default EditorContextProvider;
