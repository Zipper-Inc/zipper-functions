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
  useCallback,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react';
import noop from '~/utils/noop';

import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';
import { InputParam } from '@zipper/types';
import {
  createProject,
  getTutorialJsDocs,
  isExternalImport,
  parseApp,
} from '~/utils/parse-code';
import debounce from 'lodash.debounce';
import { removeExtension, uuid } from '@zipper/utils';
import { prettyLog } from '~/utils/pretty-log';
import { AppQueryOutput } from '~/types/trpc';
import {
  getAppHashFromScripts,
  getAppVersionFromHash,
  getScriptHash,
} from '~/utils/hashing';
import { isZipperImportUrl } from '~/utils/eszip-utils';
import {
  isTypescript,
  parsePlaygroundQuery,
  PlaygroundTab,
} from '~/utils/playground.utils';
import { runZipperLinter } from '~/utils/zipper-editor-linter';
import { rewriteSpecifier } from '~/utils/rewrite-imports';
import isEqual from 'lodash.isequal';
import { Project } from 'ts-morph';

type OnValidate = AddParameters<
  Required<EditorProps>['onValidate'],
  [filename?: string]
>;

type TutorialBlock = {
  isSelected: boolean;
  startLine: number;
  endLine: number;
  content: string;
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
  selectedTutorial: TutorialBlock;
  tutorials: TutorialBlock[];
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
  inputParamsIsLoading: boolean;
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
        inputs: Pick<
          RunEditorActionsInputs,
          'value' | 'currentScript' | 'shouldFetchImports'
        > & {
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
  inputParamsIsLoading: true,
  onValidate: noop,
  scripts: [],
  editor: undefined,
  setEditor: noop,
  tutorials: [],
  selectedTutorial: {} as TutorialBlock,
  isModelDirty: () => false,
  setModelIsDirty: noop,
  isEditorDirty: () => false,
  modelHasErrors: () => false,
  setModelHasErrors: () => false,
  editorHasErrors: () => false,
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
 * It handles all JSDocs in the current script code and returns then
 * in the tutorial block format
 * @param code current code being written
 * @param selectedTutorial current tutorial block selected in the side bar
 * @returns full jsdocs and all tutorials blocks
 */
const handleJSDocTutorials = (
  code: string,
  selectedTutorial: TutorialBlock,
) => {
  if (code?.length > 1) {
    const jsdocs = code
      .split('\n')
      .reduce((acc, curr) => {
        const line = curr.trim();

        /** get only block comments lines */
        if (line.startsWith('/**') || line.startsWith('*')) {
          return [...acc, line];
        }

        return [...acc];
      }, [] as string[])
      .join('\n')
      .split('/**')
      .filter((line) => line !== '')
      .map((line) => '/**' + line)
      .filter((block) => block.includes('@guide'));

    const tutorials = jsdocs
      .map((jsdoc) => {
        const content = jsdoc
          .split('\n')
          .filter((line) => !line.includes('/**'))
          /**
           * formating text from block comment to
           * markdown string
           * */
          .map((splitedLine) =>
            splitedLine
              .replace(/\/\*\*|\* | \*\//g, '')
              .replace('*/', '')
              .replace('*', '\n'),
          )
          .join('\n');

        /**
         * gets start-line and end-line from each function that
         * jsdocs from block comment refers.
         */
        const range = getTutorialJsDocs({ code, jsdoc });

        return {
          ...range,
          content,
        } as TutorialBlock;
      })
      .filter((doc) => !!doc.startLine)
      .map((doc, index) => ({
        ...doc,
        index,
        isSelected: index === selectedTutorial.index,
      }));

    return { jsdocs, tutorials };
  }

  return { jsdocs: [], tutorials: [] };
};

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
  project,
  externalImportModelsRef,
  invalidImportUrlsRef,
  setModelIsDirty: setModelIsDirtyPassedIn,
  readOnly,
  setTutorials: setInputTutorials,
  shouldFetchImports,
  selectedTutorial,
}: {
  value: string;
  setInputParams: any;
  setInputError: (error: string | undefined) => void;
  monacoRef: MutableRefObject<typeof monaco | undefined>;
  currentScript: Script;
  setTutorials: (tutorials: TutorialBlock[]) => void;
  selectedTutorial: TutorialBlock;
  project: Project;
  externalImportModelsRef: MutableRefObject<Record<string, string[]>>;
  invalidImportUrlsRef: MutableRefObject<{ [url: string]: number }>;
  setModelIsDirty: (path: string, isDirty: boolean) => void;
  readOnly: boolean;
  shouldFetchImports: boolean;
}): Promise<void> {
  if (!monacoRef.current || !isTypescript(currentScript) || !value) return;

  const currentModel = monacoRef.current.editor.getEditors()[0]?.getModel();
  const otherModels = monacoRef.current.editor
    .getModels()
    .filter(
      (model) =>
        currentModel &&
        model.uri.scheme === 'file' &&
        model.uri !== currentModel.uri,
    );
  const otherModules = Object.fromEntries(
    otherModels.map((model) => [
      removeExtension(model.uri.path),
      model.getValue(),
    ]),
  );

  const isVisible =
    currentModel &&
    getPathFromUri(currentModel.uri) === `/${currentScript.filename}`;

  const setInputParams = !isVisible ? noop : setInputParamsPassedIn;
  const setInputError = !isVisible || readOnly ? noop : setInputErrorPassedIn;
  const setTutorials = !isVisible ? noop : setInputTutorials;
  const setModelIsDirty = readOnly ? noop : setModelIsDirtyPassedIn;
  const linter = readOnly ? noop : runZipperLinter;

  try {
    const oldHash = currentScript.hash;
    const newHash = getScriptHash({ ...currentScript, code: value });
    setModelIsDirty(currentScript.filename, newHash !== oldHash);

    const { tutorials } = handleJSDocTutorials(value, selectedTutorial);

    if (tutorials.length >= 1) setTutorials(tutorials);
    else setTutorials([]);

    const { inputs, imports } = await parseApp({
      modules: { [currentScript.filename]: value, ...otherModules },
      handlerFile: currentScript.filename,
      project,
      throwErrors: true,
    });

    setInputParams((prevInputParams: InputParam[] | undefined) => {
      const prevLength = prevInputParams?.length || 0;
      const newLength = inputs?.length || 0;
      if (prevLength === newLength && isEqual(inputs, prevInputParams))
        return prevInputParams;
      return inputs;
    });

    setInputError(undefined);

    linter({
      imports,
      monacoRef,
      currentScript,
      externalImportModelsRef,
      invalidImportUrlsRef,
    });

    if (shouldFetchImports) {
      await handleExternalImports({
        imports,
        monacoRef,
        externalImportModelsRef,
        invalidImportUrlsRef,
        currentScript,
      });
    }
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

  const [inputParams, _setInputParams] = useState<InputParam[] | undefined>([]);
  const [inputError, setInputError] = useState<string | undefined>();
  const [tutorials, setTutorials] = useState<TutorialBlock[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialBlock>(
    {} as TutorialBlock,
  );
  const [inputParamsIsLoading, setInputParamsIsLoading] = useState(true);

  const setInputParams: Dispatch<SetStateAction<InputParam[] | undefined>> = (
    params,
  ) => {
    setInputParamsIsLoading(false);
    return _setInputParams(params);
  };

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

  const project = useMemo(createProject, []);

  const { scripts } = app;

  const currentScript = scripts.find((s) => s.id === currentScriptId);
  const setCurrentScript = (s: Script) => setCurrentScriptId(s.id);

  const onChangeSelectedDoc = (tutorialIndex: number) => {
    if (tutorialIndex === selectedTutorial.index) {
      return setSelectedTutorial({} as TutorialBlock);
    }

    console.log(tutorials[tutorialIndex]);

    return setSelectedTutorial({ ...tutorials[tutorialIndex]! });
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

  const onChange: EditorProps['onChange'] = async (value = '') => {
    if (!monacoRef?.current || !currentScript) return;
    runEditorActionsDebounced({
      value,
      setInputParams,
      setInputError,
      monacoRef,
      selectedTutorial,
      setTutorials,
      currentScript,
      project,
      externalImportModelsRef,
      invalidImportUrlsRef,
      setModelIsDirty,
      readOnly,
      shouldFetchImports: true,
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

  const isModelDirty = useCallback(
    (path: string) => {
      return modelsDirtyState[path] || false;
    },
    [modelsDirtyState],
  );

  const setModelIsDirty = useCallback(
    (path: string, isDirty: boolean) => {
      if (path.startsWith('types/')) return;

      setModelsDirtyState((previousModelsDirtyState) => {
        if (previousModelsDirtyState[path] === isDirty)
          return previousModelsDirtyState;

        const newModelState = { ...previousModelsDirtyState };
        newModelState[path] = isDirty;
        return newModelState;
      });
    },
    [setModelsDirtyState],
  );

  /** @todo convert this to a memoized boolean isntead of a function */
  const isEditorDirty = useMemo(
    () => () => !!Object.values(modelsDirtyState).find((state) => state),
    [modelsDirtyState],
  );

  const modelHasErrors = useCallback(
    (path: string) => modelsErrorState[path] || false,
    [modelsErrorState],
  );

  const setModelHasErrors = useCallback(
    (path: string, hasErrors: boolean) => {
      if (path.startsWith('types/')) return;

      setModelsErrorState((previousModelErrorState) => {
        // no updates if this is the same
        if (previousModelErrorState[path] === hasErrors)
          return previousModelErrorState;

        const newModelState = { ...previousModelErrorState };
        newModelState[path] = hasErrors;
        return newModelState;
      });
    },
    [setModelsErrorState],
  );

  const editorHasErrors = useMemo(
    () => () => !!Object.values(modelsErrorState).find((state) => state),
    [modelsErrorState],
  );

  const getErrorFiles = useMemo(
    () => () =>
      Object.entries(modelsErrorState)
        .filter(([, value]) => value)
        .map(([filename]) => filename),
    [modelsErrorState],
  );

  const runEditorActions: EditorContextType['runEditorActions'] = useCallback(
    async (
      { now = false, currentScript, value, shouldFetchImports },
      defaults = {
        value: '',
        currentScript: {} as any,
        project,
        setInputParams,
        setInputError,
        setTutorials,
        selectedTutorial,
        monacoRef,
        externalImportModelsRef,
        invalidImportUrlsRef,
        setModelIsDirty,
        readOnly,
        shouldFetchImports,
      },
    ) =>
      (now ? runEditorActionsNow : runEditorActionsDebounced)({
        ...defaults,
        currentScript,
        value,
      }),
    [
      currentScript,
      monacoRef.current,
      inputParams,
      externalImportModelsRef.current,
      invalidImportUrlsRef.current,
      setModelIsDirty,
      readOnly,
    ],
  );

  return (
    <EditorContext.Provider
      value={{
        currentScript,
        setCurrentScript,
        selectedTutorial,
        tutorials,
        onChange,
        onValidate,
        inputParamsIsLoading,
        scripts,
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
        inputParams,
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
        runEditorActions,
        readOnly,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);
export default EditorContextProvider;
