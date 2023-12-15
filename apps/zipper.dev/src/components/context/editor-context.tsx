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
  useMemo,
} from 'react';
import noop from '~/utils/noop';

import { useSelf } from '~/liveblocks.config';

import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';
import { InputParam } from '@zipper/types';
import { isExternalImport, parseCode } from '~/utils/parse-code';
import debounce from 'lodash.debounce';
import { uuid } from '@zipper/utils';
import { prettyLog } from '~/utils/pretty-log';
import { AppQueryOutput } from '~/types/trpc';
import {
  getAppHashFromScripts,
  getAppVersionFromHash,
  getScriptHash,
} from '~/utils/hashing';
import { isZipperImportUrl } from '~/utils/eszip-utils';
import {
  getOrCreateScriptModel,
  isTypescript,
  parsePlaygroundQuery,
  PlaygroundTab,
} from '~/utils/playground.utils';
import { runZipperLinter } from '~/utils/zipper-editor-linter';
import { rewriteSpecifier } from '~/utils/rewrite-imports';

type OnValidate = AddParameters<
  Required<EditorProps>['onValidate'],
  [filename?: string]
>;

type Doc = {
  type: string;
  title: string;
  description: string;
  isSelected: boolean;
  highlight_line: { start: number; end: number };
  index: number;
};

type RunEditorActionsInputs = Parameters<typeof runEditorActionsNow>[0];

export type EditorContextType = {
  currentScript?: Script;
  setCurrentScript: (script: Script) => void;
  onChange: EditorProps['onChange'];
  onValidate: OnValidate;
  onChangeSelectedDoc: (docIndex: number) => void;
  connectionId?: number;
  scripts: Script[];
  selectedDoc: Doc;
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
  refetchApp: () => Promise<any>;
  inputParams?: InputParam[];
  scriptDocs: Doc[];
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
  onChange: noop,
  onValidate: noop,
  connectionId: undefined,
  scripts: [],
  editor: undefined,
  setEditor: noop,
  selectedDoc: {} as Doc,
  isModelDirty: () => false,
  setModelIsDirty: noop,
  isEditorDirty: () => false,
  modelHasErrors: () => false,
  setModelHasErrors: () => false,
  editorHasErrors: () => false,
  scriptDocs: [],
  onChangeSelectedDoc: () => false,
  getErrorFiles: () => [],
  isSaving: false,
  setIsSaving: noop,
  save: async () => {
    return '';
  },
  refetchApp: async () => {
    return;
  },
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
  setInputParams: setInputParamsPassedIn,
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
  if (!monacoRef.current || !isTypescript(currentScript)) return;

  const currentModel = monacoRef.current.editor.getEditors()[0]?.getModel();

  const isVisible =
    currentModel &&
    getPathFromUri(currentModel.uri) === `/${currentScript.filename}`;

  const setInputParams = !isVisible ? noop : setInputParamsPassedIn;
  const setInputError = !isVisible || readOnly ? noop : setInputErrorPassedIn;
  const setModelIsDirty = readOnly ? noop : setModelIsDirtyPassedIn;
  const linter = readOnly ? noop : runZipperLinter;

  try {
    const oldHash = currentScript.hash;
    const newHash = getScriptHash({ ...currentScript, code: value });
    setModelIsDirty(currentScript.filename, newHash !== oldHash);

    const { inputs, imports, comments } = parseCode({
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
  refetchApp,
  readOnly,
}: {
  app: AppQueryOutput;
  children: any;
  appId: string | undefined;
  appSlug: string | undefined;
  resourceOwnerSlug: string | undefined;
  refetchApp: () => Promise<any>;
  readOnly: boolean;
}) => {
  const [currentScriptId, setCurrentScriptId] = useState<string>();

  const [inputParams, setInputParams] = useState<InputParam[] | undefined>([]);
  const [inputError, setInputError] = useState<string | undefined>();

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

  const { scripts } = app;

  const currentScript = scripts.find((s) => s.id === currentScriptId);
  const setCurrentScript = (s: Script) => setCurrentScriptId(s.id);

  const [selectedDoc, setSelectedDoc] = useState<Doc>({} as Doc);

  const scriptDocs = useMemo(() => {
    const customOrder = ['title', 'heading_1', 'heading_2', 'heading_3'];

    const docs = currentScript?.code
      .split('\n')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      .reduce((acc, curr) => {
        if (curr.trim().startsWith('/**') || curr.trim().startsWith('*')) {
          return [...acc, curr.trim()];
        } else if (curr.trim().startsWith('export async function handler')) {
          return acc;
        } else {
          return acc;
        }
      }, [] as string[])
      .map((line) => (line.startsWith('*') ? ' ' + line : line))
      .join('\n')
      .split('/**')
      .filter((line) => line !== '' && line.includes('----'))
      .map((line) => String('/**' + '\n' + line).split('\n'))
      .reduce(
        (acc, curr) => [
          ...acc,
          {
            type: curr
              .map((line) => line.trim())
              .find((line) => line.trim().startsWith('* type:'))
              ?.replace('* type: ', '')
              .replace(' ', ''),
            description: curr
              .filter(
                (line) =>
                  !line.trim().includes('----') &&
                  !line.trim().startsWith('* name:') &&
                  !line.trim().startsWith('* type:') &&
                  !line.trim().startsWith('* highlight:') &&
                  line.trim().startsWith('*'),
              )
              .map((line) => line.trim())
              .join('\n')
              .replace(/^\* /gm, '')
              .replace(/\*\/|\/\*/g, ''),
            title: curr
              .map((line) => line.trim())
              .find((line) => line.trim().startsWith('* name:'))
              ?.replace('* name: ', '')
              .replace(' ', ''),
            highlight_line: curr
              .map((line) => line.trim())
              .find((line) => line.trim().startsWith('* highlight:'))
              ?.replace('* highlight: ', '')
              .split('-')
              .map((data, index) => ({ value: Number(data), index }))
              .reduce(
                (acc, curr) =>
                  curr.index === 0
                    ? { ...acc, start: curr.value }
                    : { ...acc, end: curr.value },
                {},
              ),
          },
        ],
        [] as any[],
      ) as Doc[];

    return docs
      ?.sort((a, b) => {
        const typeA = a.type;
        const typeB = b.type;

        return customOrder.indexOf(typeA) - customOrder.indexOf(typeB);
      })
      .map((doc, index) => ({
        ...doc,
        isSelected: index === selectedDoc?.index,
        index,
      }));
  }, [currentScript, selectedDoc]);

  const onChangeSelectedDoc = (docIndex: number) => {
    if (docIndex === selectedDoc.index) {
      setSelectedDoc({} as Doc);
      return;
    }

    setSelectedDoc({ ...scriptDocs[docIndex]! });
  };

  const resetDirtyState = () => {
    setModelsDirtyState(
      (Object.keys(modelsDirtyState) as string[]).reduce((acc, elem) => {
        return {
          ...acc,
          [elem]: false,
        };
      }, {} as Record<string, boolean>),
    );
  };

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

  const router = useRouter();

  useEffect(() => {
    if (currentScript && monacoRef.current) {
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
  }, [currentScript, monacoRef.current]);

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

  const getCodeByFilename = async (applyFormatting = true) => {
    if (applyFormatting) {
      const formatPromises = editor
        ?.getEditors()
        .map((e) => e.getAction('editor.action.formatDocument')?.run());

      if (formatPromises && formatPromises.length)
        await Promise.all(formatPromises).catch();
    }

    return (
      editor?.getModels().reduce<Record<string, string>>((files, model) => {
        if (model.uri.scheme === 'file') {
          // Strip the extra '.ts' that's required by intellisense
          files[getPathFromUri(model.uri).replace(/^\//, '')] =
            model.getValue();
        }
        return files;
      }, {}) || {}
    );
  };

  const saveOpenModels = async () => {
    if (!appId || !currentScript)
      throw new Error('Something went wrong while saving');

    const codeByFilename = await getCodeByFilename();

    const hash = getAppHashFromScripts(
      app,
      scripts.map((s) => ({
        ...s,
        code: codeByFilename[s.filename] || '',
      })),
    );

    if (hash === app.playgroundVersionHash) {
      addLog(
        'info',
        prettyLog({
          badge: 'Save',
          topic: `${appSlug}@${getAppVersionFromHash(hash)}`,
          subtopic: 'DONE',
          msg: 'No changes detected',
        }),
      );
      resetDirtyState();
      return hash;
    }

    setIsSaving(true);

    const upcomingVersion = getAppVersionFromHash(hash);

    addLog(
      'info',
      prettyLog({
        badge: 'Save',
        topic: `${appSlug}@${upcomingVersion}`,
        subtopic: 'Pending',
      }),
    );

    try {
      const newApp = await editAppMutation.mutateAsync({
        id: appId,
        data: {
          scripts: scripts.map((script: any) => ({
            id: script.id,
            data: {
              name: script.name,
              description: script.description || '',
              code: codeByFilename[script.filename],
              filename: script.filename,
            },
          })),
        },
      });

      setIsSaving(false);

      if (newApp.playgroundVersionHash !== hash) {
        throw new Error('Something went wrong while saving the applet');
      }

      resetDirtyState();

      const newVersion = getAppVersionFromHash(newApp.playgroundVersionHash);

      addLog(
        'info',
        prettyLog({
          badge: 'Save',
          topic: `${appSlug}@${newVersion}`,
          subtopic: 'Done',
          msg:
            newVersion !== upcomingVersion
              ? 'You saved a new version.'
              : undefined,
        }),
      );

      return newApp.playgroundVersionHash;
    } catch (e: any) {
      setIsSaving(false);
      addLog(
        'error',
        prettyLog({
          badge: 'SAVE',
          topic: `${appSlug}@${upcomingVersion}`,
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
        selectedDoc,
        onChange,
        onValidate,
        connectionId: self?.connectionId,
        scripts,
        editor,
        setEditor,
        isModelDirty,
        setModelIsDirty,
        isEditorDirty,
        scriptDocs,
        modelHasErrors,
        setModelHasErrors,
        editorHasErrors,
        getErrorFiles,
        isSaving,
        setIsSaving,
        save: saveOpenModels,
        refetchApp,
        inputParams,
        setInputParams,
        inputError,
        monacoRef,
        logs,
        addLog,
        setLogStore,
        markLogsAsRead,
        onChangeSelectedDoc,
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
