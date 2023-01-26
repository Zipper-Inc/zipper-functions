import * as monaco from 'monaco-editor';
import Editor, { EditorProps, useMonaco, loader } from '@monaco-editor/react';
import 'vscode';
import { StandaloneServices } from 'vscode/services';
import getMessageServiceOverride from 'vscode/service-override/messages';
import { buildWorkerDefinition } from 'monaco-editor-workers';

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
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Uri } from 'vscode';
import { EditorContext } from '../context/editorContext';

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
          references: true,
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
  const { currentScript, scripts, setEditor } = useContext(EditorContext);
  const editorRef = useRef<MonacoEditor>();
  const monacoRef = useRef<Monaco>();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const monacoEditor = useMonaco();
  const url = useMemo(
    () => process.env.NEXT_PUBLIC_LSP,
    [process.env.NEXT_PUBLIC_LSP],
  );

  function createWebSocket(url: string) {
    console.log('creating websocket');
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => {
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
      reader.onClose(() => languageClient?.stop());
    };
  }

  function handleEditorDidMount(editor: MonacoEditor, _monaco: Monaco) {
    console.log('editor mounted');
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    editorRef.current = editor;
    // clear existing models
    monacoRef.current?.editor.getModels().forEach((model) => model.dispose());
    monacoRef.current?.languages.typescript.javascriptDefaults.setEagerModelSync(
      true,
    );
    setIsEditorReady(true);
  }

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
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        isolatedModules: true,
      });

      if (url) {
        createWebSocket(url);
      }

      scripts.forEach((script) => {
        const model = monacoEditor.editor.getModel(
          Uri.parse(`file://${props.appName}/${script.filename}`),
        );
        if (!model) {
          //create model for each script file
          monacoEditor.editor.createModel(
            script.code,
            'typescript',
            Uri.parse(`file://${props.appName}/${script.filename}`),
          );
        }
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
        editorRef.current.setModel(newModel);
      }
    }
  }, [currentScript, editorRef.current, isEditorReady]);

  return (
    <Editor
      defaultLanguage="typescript"
      theme="vs-light"
      options={{
        minimap: { enabled: false },
        automaticLayout: true,
      }}
      onMount={handleEditorDidMount}
      {...props}
    />
  );
}
