import * as monaco from 'monaco-editor';
import Editor, {
  EditorProps,
  useMonaco,
  loader,
  Monaco,
} from '@monaco-editor/react';
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

loader.config({ monaco });

buildWorkerDefinition(
  '../../../workers',
  new URL('', window.location.href).href,
  false,
);

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
  } = useEditorContext();
  const { appInfo } = useRunAppContext();
  const editorRef = useRef<MonacoEditor>();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const monacoEditor = useMonaco();
  const [, updateMyPresence] = useMyPresence();
  const connectionIds = useOthersConnectionIds();

  useExitConfirmation({ enable: isEditorDirty(), ignorePaths: ['/edit/'] });

  const handleEditorDidMount = (editor: MonacoEditor, monaco: Monaco) => {
    console.log('editor mounted');

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
          fixedOverflowWidgets: true,
        }}
        overrideServices={{
          openerService: {
            open: function (url: string) {
              const resource = getUriFromPath(url, monaco.Uri.parse);
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
