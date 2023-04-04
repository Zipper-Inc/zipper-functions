import * as monaco from 'monaco-editor';
import Editor, { EditorProps, useMonaco, loader } from '@monaco-editor/react';
import 'vscode';
import { StandaloneServices } from 'vscode/services';
import getMessageServiceOverride from 'vscode/service-override/messages';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import { useMyPresence, useOthersConnectionIds } from '~/liveblocks.config';
import {
  CloseAction,
  DocumentUri,
  ErrorAction,
  MessageTransports,
  MonacoLanguageClient,
  MonacoServices,
  RequestType,
  TextDocumentIdentifier,
} from 'monaco-languageclient';

import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from 'vscode-ws-jsonrpc';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Range, Uri } from 'vscode';
import { useEditorContext } from '../context/editor-context';
import { useExitConfirmation } from '~/hooks/use-exit-confirmation';
import { PlaygroundCollabCursor } from './playground-collab-cursor';
import { format } from '~/utils/prettier';
import { useRunAppContext } from '../context/run-app-context';

export interface CacheParams {
  referrer: TextDocumentIdentifier;
  uris: TextDocumentIdentifier[];
}

type MonacoEditor = monaco.editor.IStandaloneCodeEditor;
type Monaco = typeof monaco;

loader.config({ monaco });

StandaloneServices.initialize({
  ...getMessageServiceOverride(document.body),
});
buildWorkerDefinition(
  '../../../workers',
  new URL('', window.location.href).href,
  false,
);

function createLanguageClient(
  transports: MessageTransports,
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: 'deno',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ['typescript'],
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },
      initializationOptions: {
        documentFormattingEdits: false,
        certificateStores: null,
        enablePaths: [],
        config: null,
        importMap: null,
        internalDebug: false,
        lint: true,
        path: null,
        tlsCertificate: null,
        unsafelyIgnoreCertificateErrors: null,
        unstable: true,
        enable: true,
        cache: null,
        codeLens: {
          implementations: true,
          references: false,
        },
        suggest: {
          autoImports: true,
          completeFunctionCalls: true,
          names: true,
          paths: true,
          imports: {
            autoDiscover: true,
            hosts: {
              'https://deno.land': true,
            },
          },
        },
      },
      middleware: {
        provideDocumentFormattingEdits(document) {
          const firstLine = 0;
          const firstCol = 0;
          const lastLine = document.lineCount - 1;
          const lastCol = document.lineAt(lastLine).text.length;
          const range = new Range(firstLine, firstCol, lastLine, lastCol);
          return [
            {
              newText: format(document.getText()),
              range,
            },
          ];
        },
        provideDocumentRangeFormattingEdits(document, range) {
          return [{ newText: format(document.getText(range)), range }];
        },

        workspace: {
          configuration: () => {
            return [
              {
                enable: true,
              },
            ];
          },
        },
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: () => {
        return Promise.resolve(transports);
      },
    },
  });
}

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
  } = useEditorContext();
  const { appInfo } = useRunAppContext();
  const editorRef = useRef<MonacoEditor>();
  const monacoRef = useRef<Monaco>();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [hasWebsocket, setHasWebsocket] = useState(false);
  const monacoEditor = useMonaco();
  const [, updateMyPresence] = useMyPresence();
  const connectionIds = useOthersConnectionIds();

  const url = useMemo(
    () => process.env.NEXT_PUBLIC_LSP,
    [process.env.NEXT_PUBLIC_LSP],
  );

  useExitConfirmation({ enable: isEditorDirty(), ignorePaths: ['/edit/'] });

  const createWebSocket = (url: string) => {
    console.log('creating websocket');
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => {
      setHasWebsocket(true);
      console.log('websocket opened');
      const socket = toSocket(webSocket);
      const reader = new WebSocketMessageReader(socket);
      const writer = new WebSocketMessageWriter(socket);
      const languageClient = createLanguageClient({
        reader,
        writer,
      });
      languageClient.start();

      monaco.editor.registerCommand(
        'deno.cache',
        (_accessor, uris: DocumentUri[] = []) => {
          languageClient?.sendRequest(
            new RequestType<CacheParams, boolean, void>('deno/cache'),
            {
              referrer: {
                uri: editorRef.current?.getModel()?.uri.toString(),
              },
              uris: uris.map((uri) => ({ uri })),
            },
          );
        },
      );

      reader.onClose(() => {
        setHasWebsocket(false);
        languageClient?.stop();
      });
    };
    webSocket.onclose = () => {
      setHasWebsocket(false);
    };
  };

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

      MonacoServices.install();
      const diagnosticOptions = {
        diagnosticCodesToIgnore: [
          // Ignore this error so we can import Deno URLs
          // TS2691: An import path cannot end with a '.ts' extension.
          2691,
          // Ignore this error so we can import Deno and Zipper URLs
          // TS2792: Cannot find module.
          2792,
          // Ignore this error so we can use the main function
          // TS6133: `main` is declared but never read
          6133,
        ],
      };

      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
        diagnosticOptions,
      );
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
        diagnosticOptions,
      );

      // Add Deno and Zipper types
      ['deno.d.ts', 'zipper.d.ts'].forEach(async (filename) => {
        const uri = `typescript://types/${filename}`;
        const monacoUri = monaco.Uri.parse(uri);

        if (!monaco.editor.getModel(monacoUri)) {
          const response = await fetch(`/api/ts/declarations/${filename}`);
          const src = await response.text();

          monaco.languages.typescript.javascriptDefaults.addExtraLib(src, uri);
          monaco.editor.createModel(src, 'typescript', monacoUri);
        }
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        isolatedModules: true,
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        lib: ['esnext', 'dom', 'deno.ns'],
      });

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        isolatedModules: true,
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        lib: ['esnext', 'dom', 'deno.ns'],
      });

      if (url && !hasWebsocket) {
        createWebSocket(url);
      }

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
        const model = monacoEditor.editor.getModel(
          Uri.parse(`file://${props.appName}/${script.filename}`),
        );
        if (!model) {
          //create model for each script file
          monacoEditor.editor.createModel(
            localStorage.getItem(`script-${script.id}`) || script.code,
            'typescript',
            Uri.parse(`file://${props.appName}/${script.filename}`),
          );
        }
      });

      monacoEditor.editor.getModels().forEach((model) => {
        model.onDidChangeContent((e) => {
          if (e.changes[0]?.text !== model.getValue())
            setModelIsDirty(model.uri.path.toString(), true);
        });
        setModelIsDirty(model.uri.path.toString(), false);
      });

      setEditor(monaco.editor);
    }
  }, [monacoEditor]);

  useEffect(() => {
    if (monacoEditor && editorRef.current && isEditorReady && currentScript) {
      const model = monacoEditor.editor.getModel(
        Uri.parse(`file://${props.appName}/${currentScript.filename}`),
      );
      if (model) {
        editorRef.current.setModel(model);
      }
      if (!model && currentScript) {
        const newModel = monacoEditor.editor.createModel(
          currentScript.code,
          'typescript',
          Uri.parse(`file://${props.appName}/${currentScript.filename}`),
        );
        setModelIsDirty(newModel.uri.path.toString(), false);
        newModel.onDidChangeContent((e) => {
          if (e.changes[0]?.text !== newModel.getValue())
            setModelIsDirty(newModel.uri.path.toString(), true);
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
