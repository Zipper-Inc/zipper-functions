import Editor, {
  EditorProps,
  loader,
  Monaco,
  useMonaco,
} from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import {
  StoredScriptId,
  useMyPresence,
  useOthersConnectionIds,
  useRoom,
} from '~/liveblocks.config';

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { useColorModeValue } from '@chakra-ui/react';
import { baseColors, prettierFormat, useCmdOrCtrl } from '@zipper/ui';
import MonacoJSXHighlighter from 'monaco-jsx-highlighter';
import { use, useEffect, useRef, useState } from 'react';
import { useExitConfirmation } from '~/hooks/use-exit-confirmation';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import * as Y from 'yjs';
import LiveblocksProvider, { Awareness } from '@liveblocks/yjs';
import { MonacoBinding } from 'y-monaco';

import { PlaygroundCollabCursor } from './playground-collab-cursor';
import { BaseUserMeta, JsonObject, LsonObject } from '@liveblocks/client';
import { TypedLiveblocksProvider } from '~/liveblocks.config';
import { set } from 'lodash';
import { Script } from '@prisma/client';
// import { getRewriteRule } from '~/utils/rewrite-imports';

type MonacoEditor = monaco.editor.IStandaloneCodeEditor;

loader.config({ monaco });

buildWorkerDefinition(
  '../../../workers',
  new URL('', window.location.href).href,
  false,
);

const TYPESCRIPT_ERRORS_TO_IGNORE = [
  // Ignore this error so we can import Deno URLs
  // TS2691: An import path cannot end with a '.ts' extension.
  2691,
  // Ignore this error so we can import Deno and Zipper URLs
  // TS2792: Cannot find module.
  2792,
  // Ignore this error because we will check if modules are valid ourselves
  // see Z001 in zipper-editor-linter
  // TS2307: Cannot find module or it's corresponding type declarations.
  2307,
  // Allow parameters to have an implicit `any` type
  7006,
  // Allow destructured elements to have an implicit `any` type.
  7031,
];

function getOrCreateScriptModel(script: Script) {
  const extension = script.filename.split('.').pop();
  const path = script.filename;
  const uri = getUriFromPath(path, monaco.Uri.parse, 'tsx');
  return (
    monaco.editor.getModel(uri) ||
    monaco.editor.createModel(
      script.code,
      extension === 'md' ? 'markdown' : 'typescript',
      uri,
    )
  );
}

const isExternalResource = (resource: string | monaco.Uri) =>
  /^https?/.test(resource.toString());

export default function PlaygroundEditor(
  props: EditorProps & {
    appName: string;
  },
) {
  const {
    setCurrentScript,
    currentScript,
    scripts,
    setEditor,
    isEditorDirty,
    monacoRef,
    runEditorActions,
    readOnly,
  } = useEditorContext();
  const { appInfo, boot } = useRunAppContext();
  const editorRef = useRef<MonacoEditor>();
  const yRefs = useRef<{ yDoc?: Y.Doc; yProvider?: TypedLiveblocksProvider }>({
    yDoc: undefined,
    yProvider: undefined,
  });
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const monacoEditor = useMonaco();
  const [, updateMyPresence] = useMyPresence();
  const connectionIds = useOthersConnectionIds();
  const [defaultLanguage, setDefaultLanguage] = useState<
    'typescript' | 'markdown'
  >('typescript');
  const theme = useColorModeValue('vs', 'vs-dark');

  useExitConfirmation({ enable: isEditorDirty(), ignorePaths: ['/src/'] });

  const handleEditorDidMount = (editor: MonacoEditor, monaco: Monaco) => {
    console.log('editor mounted');

    monaco.editor.defineTheme('vs-dark', {
      inherit: true,
      base: 'vs-dark',
      rules: [],
      colors: {
        'editor.background': baseColors.gray[800],
        'dropdown.background': baseColors.gray[800],
        'editorWidget.background': baseColors.gray[800],
        'input.background': baseColors.gray[800],
      },
    });

    const monacoJSXHighlighter = new MonacoJSXHighlighter(
      monaco,
      parse,
      traverse,
      editor,
    );

    // Activate highlighting (debounceTime default: 100ms)s
    monacoJSXHighlighter.highlightOnDidChangeModelContent(100);
    // Activate JSX commenting
    monacoJSXHighlighter.addJSXCommentCommand();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    monacoRef!.current = monaco;
    editorRef.current = editor;

    monacoRef?.current?.languages.typescript.javascriptDefaults.setEagerModelSync(
      true,
    );

    // set up cursor tracking
    // liveblocks here
    /*
    editor.onDidChangeCursorSelection(({ selection }) => {
      try {
        updateMyPresence({ selection: { ...selection } });
      } catch (e) {
        console.error('Caught error in updateMyPresence', e);
      }
    });
    */

    setIsEditorReady(true);

    // A hack to take over the opening of models by trying to cmd+click
    // or view a link to a model
    // @see https://github.com/Microsoft/monaco-editor/issues/2000#issuecomment-649622966
    const editorService = (editor as any)._codeEditorService;
    const openEditorBase = editorService.openCodeEditor.bind(editorService);
    editorService.openCodeEditor = async (
      input: { resource: monaco.Uri },
      source: typeof editor,
    ) => {
      const { resource } = input;

      if (isExternalResource(resource)) {
        const { scheme, authority } = resource;
        const path = getPathFromUri(resource);
        window.open(`${scheme}://${authority}${path}`);
        return null;
      }

      const result = await openEditorBase(input, source);

      if (result === null) {
        const path = getPathFromUri(resource);
        const script = scripts.find((s) => path === `/${s.filename}`);
        if (script) setCurrentScript(script);
      }

      return result;
    };
  };

  useEffect(() => {
    if (monacoEditor) {
      monacoEditor.languages.register({
        id: 'typescript',
        extensions: ['.ts', '.tsx'],
        mimetypes: ['application/typescript'],
      });

      monacoEditor.languages.register({
        id: 'markdown',
        extensions: ['.md'],
        mimetypes: ['text/markdown'],
      });

      const diagnosticOptions: monaco.languages.typescript.DiagnosticsOptions =
        {
          diagnosticCodesToIgnore: TYPESCRIPT_ERRORS_TO_IGNORE,
        };

      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
        diagnosticOptions,
      );
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
        diagnosticOptions,
      );

      // Add Deno and Zipper types
      const extraLibs =
        monaco.languages.typescript.typescriptDefaults.getExtraLibs();

      ['deno.d.ts', 'zipper.d.ts', 'jsx.d.ts'].forEach(async (filename) => {
        const path = `types/${filename}`;

        if (!extraLibs[path]) {
          const response = await fetch(
            `/api/editor/ts/declarations/${filename}`,
          );
          const src = await response.text();
          monaco.languages.typescript.typescriptDefaults.addExtraLib(src, path);
        }
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        strict: true,
        isolatedModules: true,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        lib: ['esnext', 'dom', 'deno.ns'],
        noResolve: true,
        jsx: monaco.languages.typescript.JsxEmit.Preserve,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        disableSizeLimit: true,
      });

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        strict: true,
        isolatedModules: true,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        lib: ['esnext', 'dom', 'deno.ns'],
        jsx: monaco.languages.typescript.JsxEmit.Preserve,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        disableSizeLimit: true,
      });

      // Fallback formatter
      monaco.languages.registerDocumentFormattingEditProvider('typescript', {
        provideDocumentFormattingEdits(model) {
          const formatted = prettierFormat(model.getValue());
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        },
      });

      // Fallback range formatter
      monaco.languages.registerDocumentRangeFormattingEditProvider(
        'typescript',
        {
          provideDocumentRangeFormattingEdits(model, range) {
            const formatted = prettierFormat(model.getValueInRange(range));
            return [
              {
                range: range,
                text: formatted,
              },
            ];
          },
        },
      );

      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

      setEditor(monaco.editor);
      if (monacoRef) monacoRef.current = monaco;

      // Create models for each script
      scripts.forEach((script) => {
        getOrCreateScriptModel(script);
        runEditorActions({
          now: true,
          value: script.code,
          currentScript: script,
        });
      });

      // start the boot don't wait for it to finish
      boot();
      setIsModelReady(true);

      if (process.env.NODE_ENV === 'development')
        (window as any).monaco = monaco;
    }
  }, [monacoEditor]);

  // switch files
  useEffect(() => {
    if (monacoEditor && editorRef.current && isEditorReady && currentScript) {
      editorRef.current.setModel(getOrCreateScriptModel(currentScript));
    }
  }, [currentScript, editorRef.current, isEditorReady]);

  const room = useRoom();

  const getStuffForScriptOrModel = (
    scriptOrModel: Script | monaco.editor.ITextModel,
  ) => {
    const script = !!(scriptOrModel as Script).filename
      ? (scriptOrModel as Script)
      : scripts.find(
          (s) =>
            s.filename ===
            getPathFromUri((scriptOrModel as monaco.editor.ITextModel).uri),
        );

    const model = !!(scriptOrModel as monaco.editor.ITextModel).uri
      ? (scriptOrModel as monaco.editor.ITextModel)
      : getOrCreateScriptModel(scriptOrModel as Script);

    const storedScriptId: StoredScriptId = `script-${script?.id}`;
    const yText = (yRefs.current.yDoc || new Y.Doc()).getText(storedScriptId);
    return { script, model, storedScriptId, yText };
  };

  const resetYDocToDatabase = (
    scriptOrModel: Script | monaco.editor.ITextModel,
  ) => {
    const { script, yText, model } = getStuffForScriptOrModel(scriptOrModel);
    const { yDoc } = yRefs.current;
    yDoc?.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, script?.code || model.getValue() || '');
    });
  };

  useEffect(() => {
    const bindings: MonacoBinding[] = [];

    if (isEditorReady && room && isModelReady && !readOnly) {
      if (!yRefs.current.yDoc || !yRefs.current.yProvider) {
        yRefs.current.yDoc = new Y.Doc();
        yRefs.current.yProvider = new LiveblocksProvider(
          room,
          yRefs.current.yDoc,
        );
      }

      const { yProvider } = yRefs.current;

      scripts.forEach((script) => {
        const { model, yText } = getStuffForScriptOrModel(script);

        bindings.push(
          new MonacoBinding(
            yText,
            model,
            new Set([editorRef.current!]),
            yProvider.awareness as any,
          ),
        );

        // Wait for the first sync to happen and replace empty model with script code
        yProvider.on('synced', () => {
          if (yText.length === 0 && script.code.trim().length > 0) {
            resetYDocToDatabase(script);
          }
        });
      });
    }

    return () => {
      yRefs.current.yDoc?.destroy();
      yRefs.current.yProvider?.destroy();
      bindings.forEach((b) => b?.destroy());
    };
  }, [isEditorReady, isModelReady, room, readOnly]);

  // Short cut to reset yDoc to database
  useCmdOrCtrl(
    'Shift+Option+/',
    () => {
      if (!currentScript) return;
      resetYDocToDatabase(currentScript);
    },
    [yRefs.current.yDoc, currentScript],
  );

  return (
    <>
      <Editor
        defaultLanguage={defaultLanguage}
        theme={theme}
        options={{
          fontSize: 13,
          automaticLayout: true,
          readOnly,
          fixedOverflowWidgets: true,
          renderLineHighlight: 'line',
          renderLineHighlightOnlyWhenFocus: true,
          minimap: {
            enabled: false,
          },
          scrollbar: {
            horizontal: 'hidden',
            verticalSliderSize: 2,
          },
          overviewRulerBorder: false,
        }}
        overrideServices={{
          openerService: {
            open: function (url: string) {
              const ext =
                isExternalResource(url) && !url.endsWith('tsx') ? 'ts' : 'tsx';
              const resource = getUriFromPath(url, monaco.Uri.parse, ext);
              // Don't try to open URLs that have models
              // They will open from the defintion code
              if (
                isExternalResource(resource) &&
                monacoEditor?.editor.getModel(resource)
              ) {
                return;
              }

              return window.open(url, '_blank');
            },
          },
        }}
        onMount={handleEditorDidMount}
        {...props}
      />
      {/* liveblocks  here*/}
      {connectionIds.map((id) => (
        <PlaygroundCollabCursor
          connectionId={id}
          editorRef={editorRef}
          key={id}
        />
      ))}
    </>
  );
}
