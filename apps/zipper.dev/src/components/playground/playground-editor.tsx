import Editor, {
  EditorProps,
  loader,
  Monaco,
  useMonaco,
} from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import { useMyPresence, useOthersConnectionIds } from '~/liveblocks.config';

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { useColorModeValue } from '@chakra-ui/react';
import { baseColors, prettierFormat } from '@zipper/ui';
import MonacoJSXHighlighter from 'monaco-jsx-highlighter';
import { useEffect, useRef, useState } from 'react';
import { useExitConfirmation } from '~/hooks/use-exit-confirmation';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { PlaygroundCollabCursor } from './playground-collab-cursor';

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
  /** @todo fix this error */
  // Ignore this error because we don't know how to import from web correctly yet
  // For example, this url https://esm.sh/lodash/unescape should work but it
  // TS2307: Cannot find module or it's corresponding type declarations.
  2307,
  // Allow parameters to have an implicit `any` type
  7006,
  // Allow destructured elements to have an implicit `any` type.
  7031,
];

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
    currentScriptLive,
    scripts,
    setEditor,
    setModelIsDirty,
    isEditorDirty,
    connectionId,
    monacoRef,
    onValidate,
  } = useEditorContext();
  const { appInfo, boot } = useRunAppContext();
  const editorRef = useRef<MonacoEditor>();
  const [isEditorReady, setIsEditorReady] = useState(false);
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
    editor.onDidChangeCursorSelection(({ selection }) => {
      try {
        updateMyPresence({ selection: { ...selection } });
      } catch (e) {
        console.error('Caught error in updateMyPresence', e);
      }
    });

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

      scripts.forEach((script) => {
        const extension = script.filename.split('.').pop();
        const uri = getUriFromPath(script.filename, monaco.Uri.parse, 'tsx');
        const model = monaco.editor.getModel(uri);
        if (!model) {
          monaco.editor.createModel(
            script.code,
            extension === 'md' ? 'markdown' : 'typescript',
            uri,
          );
        }
      });

      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

      monacoEditor.editor.getModels().forEach((model) => {
        const path = getPathFromUri(model.uri);
        model.onDidChangeContent((e) => {
          if (e.changes[0]?.text !== model.getValue())
            setModelIsDirty(path, true);
        });
        setModelIsDirty(path, false);
      });

      setEditor(monaco.editor);

      if (process.env.NODE_ENV === 'development')
        (window as any).monaco = monaco;
    }
  }, [monacoEditor]);

  /**
   * Copy pasted/edited from react-monaco code
   * Runs the validation on start of editor for each file
   */
  useEffect(() => {
    if (isEditorReady) {
      const changeMarkersListener =
        monacoRef?.current!.editor.onDidChangeMarkers((uris) => {
          uris
            .filter((uri) => uri.scheme === 'file')
            .forEach((uri) => {
              const markers = monacoRef?.current!.editor.getModelMarkers({
                resource: uri,
              });
              const filename = getPathFromUri(uri).replace(/^\//, '');
              onValidate(markers, filename);
            });
        });

      return () => {
        changeMarkersListener?.dispose();
      };
    }
  }, [isEditorReady]);

  useEffect(() => {
    if (monacoEditor && editorRef.current && isEditorReady && currentScript) {
      const extension = currentScript.filename.split('.').pop();

      if (extension === 'md') {
        setDefaultLanguage('markdown');
      }

      const uri = getUriFromPath(
        currentScript.filename,
        monaco.Uri.parse,
        'tsx',
      );
      const model = monacoEditor.editor.getModel(uri);
      if (model) {
        editorRef.current.setModel(model);
      }
      if (!model && currentScript) {
        const newModel = monacoEditor.editor.createModel(
          currentScript.code,
          extension === 'md' ? 'markdown' : 'typescript',
          uri,
        );
        const path = getPathFromUri(uri);
        setModelIsDirty(path, false);
        newModel.onDidChangeContent((e) => {
          if (e.changes[0]?.text !== newModel.getValue())
            setModelIsDirty(path, true);
        });
        editorRef.current.setModel(newModel);
      }
    }
  }, [currentScript, editorRef.current, isEditorReady]);

  useEffect(() => {
    if (isEditorReady) boot();
  }, [isEditorReady]);

  // Execute edits
  useEffect(() => {
    if (
      !editorRef.current ||
      !editorRef.current.getModel() ||
      !currentScriptLive
    )
      return;

    // don't execute any edits if this is coming from your own connection
    if (connectionId === currentScriptLive.lastConnectionId) return;

    const range = (
      editorRef.current.getModel() as monaco.editor.ITextModel
    ).getFullModelRange();

    const selection = editorRef.current.getSelection();

    editorRef.current.executeEdits(
      'zipperLiveUpdate',
      [
        {
          range,
          text: currentScriptLive?.code,
          forceMoveMarkers: true,
        },
      ],
      /**
       * @todo resolve where the new selection might be based on the edited range
       * just putting it here is way better for now
       */
      selection ? [selection] : undefined,
    );
    editorRef.current.pushUndoStop();
  }, [connectionId, currentScriptLive?.code, editorRef.current]);

  return (
    <>
      <Editor
        defaultLanguage={defaultLanguage}
        theme={theme}
        options={{
          fontSize: 13,
          automaticLayout: true,
          readOnly: !appInfo.canUserEdit,
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
