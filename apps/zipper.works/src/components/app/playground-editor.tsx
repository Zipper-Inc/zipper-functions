import * as monaco from 'monaco-editor';
import Editor, { EditorProps, useMonaco, loader } from '@monaco-editor/react';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import { useMyPresence, useOthersConnectionIds } from '~/liveblocks.config';

import { useEffect, useRef, useState } from 'react';
import { useEditorContext } from '../context/editor-context';
import { useExitConfirmation } from '~/hooks/use-exit-confirmation';
import { PlaygroundCollabCursor } from './playground-collab-cursor';
import { format } from '~/utils/prettier';
import { useRunAppContext } from '../context/run-app-context';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';

type MonacoEditor = monaco.editor.IStandaloneCodeEditor;
type Monaco = typeof monaco;

loader.config({ monaco });

buildWorkerDefinition(
  '../../../workers',
  new URL('', window.location.href).href,
  false,
);

export default function PlaygroundEditor(
  props: EditorProps & {
    appName: string;
  },
) {
  const {
    currentScript,
    currentScriptLive,
    scripts,
    setEditor,
    setModelIsDirty,
    isEditorDirty,
    connectionId,
    unhandledImports,
    importSetRef,
  } = useEditorContext();
  const { appInfo } = useRunAppContext();
  const editorRef = useRef<MonacoEditor>();
  const monacoRef = useRef<Monaco>();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const monacoEditor = useMonaco();
  const [, updateMyPresence] = useMyPresence();
  const connectionIds = useOthersConnectionIds();

  useExitConfirmation({ enable: isEditorDirty(), ignorePaths: ['/edit/'] });

  const handleEditorDidMount = (editor: MonacoEditor, _monaco: Monaco) => {
    console.log('editor mounted');
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    editorRef.current = editor;
    // clear existing models
    monacoRef.current?.editor.getModels().forEach((model) => model.dispose());
    monacoRef.current?.languages.typescript.javascriptDefaults.setEagerModelSync(
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
  };

  useEffect(() => {
    if (monacoEditor) {
      monacoEditor.languages.register({
        id: 'typescript',
        extensions: ['.ts', '.tsx'],
        mimetypes: ['application/typescript'],
      });

      const diagnosticOptions: monaco.languages.typescript.DiagnosticsOptions =
        {
          diagnosticCodesToIgnore: [
            // Ignore this error so we can import Deno URLs
            // TS2691: An import path cannot end with a '.ts' extension.
            2691,
            // Ignore this error so we can import Deno and Zipper URLs
            // TS2792: Cannot find module.
            2792,
          ],
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

      ['deno.d.ts', 'zipper.d.ts'].forEach(async (filename) => {
        const path = `types/${filename}`;

        if (!extraLibs[path]) {
          const response = await fetch(`/api/ts/declarations/${filename}`);
          const src = await response.text();
          monaco.languages.typescript.typescriptDefaults.addExtraLib(src, path);
        }
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        isolatedModules: true,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        lib: ['esnext', 'dom', 'deno.ns'],
        noResolve: true,
      });

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        isolatedModules: true,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        lib: ['esnext', 'dom', 'deno.ns'],
      });

      // Fallback formatter
      monaco.languages.registerDocumentFormattingEditProvider('typescript', {
        provideDocumentFormattingEdits(model) {
          const formatted = format(model.getValue());
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
            const formatted = format(model.getValueInRange(range));
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
        const uri = getUriFromPath(script.filename, monaco.Uri.parse);
        const model = monaco.editor.getModel(uri);
        const code = localStorage.getItem(`script-${script.id}`) || script.code;
        if (!model) {
          monaco.editor.createModel(code, 'typescript', uri);
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
    }
  }, [monacoEditor]);

  useEffect(() => {
    if (monacoEditor && editorRef.current && isEditorReady && currentScript) {
      const uri = getUriFromPath(currentScript.filename, monaco.Uri.parse);
      const model = monacoEditor.editor.getModel(uri);
      if (model) {
        editorRef.current.setModel(model);
      }
      if (!model && currentScript) {
        const newModel = monacoEditor.editor.createModel(
          currentScript.code,
          'typescript',
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

  // Handle imports
  // Handle new imports
  useEffect(() => {
    if (!monacoEditor || !importSetRef) return;
    unhandledImports.forEach(async (importUrl) => {
      try {
        // optimistically add it to the import set
        importSetRef.current.add(importUrl);

        console.log('[IMPORTS]', `(${importUrl})`, 'Fetching import');

        const bundle = await fetch(
          `/api/ts/module?x=${importUrl}&bundle=1`,
        ).then((r) => r.json());

        Object.keys(bundle).forEach((url) => {
          console.log('[IMPORTS]', `(${importUrl})`, `Handling ${url}`);
          const src = bundle[url];
          const uri = getUriFromPath(url, monacoEditor.Uri.parse);
          if (!monacoEditor.editor.getModel(uri)) {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              src,
              uri.toString(),
            );
          }
        });
      } catch (e) {
        // remove it from the import set if there's an error
        importSetRef.current.delete(importUrl);
        console.error('[IMPORTS]', '∟ ', 'Error adding import', e);
      }
    });
  }, [unhandledImports, monacoEditor, importSetRef]);

  return (
    <>
      <Editor
        defaultLanguage="typescript"
        theme="vs-light"
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollbar: { verticalScrollbarSize: 0, horizontalScrollbarSize: 0 },
          readOnly: !appInfo.canUserEdit,
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
