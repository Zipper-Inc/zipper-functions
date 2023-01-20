import * as monaco from 'monaco-editor';
import Editor, { EditorProps, useMonaco, loader } from '@monaco-editor/react';
import 'vscode';
import { StandaloneServices } from 'vscode/services';
import getMessageServiceOverride from 'vscode/service-override/messages';
import { buildWorkerDefinition } from 'monaco-editor-workers';

import {
  CloseAction,
  ErrorAction,
  MessageTransports,
  MonacoLanguageClient,
  MonacoServices,
} from 'monaco-languageclient';

import normalizeUrl from 'normalize-url';
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from 'vscode-ws-jsonrpc';
import { useEffect, useMemo } from 'react';

loader.config({ monaco });

StandaloneServices.initialize({
  ...getMessageServiceOverride(document.body),
});
buildWorkerDefinition(
  '../../../workers',
  new URL('', window.location.href).href,
  false,
);

export function createUrl(
  hostname: string,
  port: string | undefined,
  path: string,
): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const hostAndPort = port ? `${hostname}:${port}` : hostname;
  return normalizeUrl(`${protocol}://${hostAndPort}${path}`);
}

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
    // commands.registerCommand('deno.cache', (uris: DocumentUri[] = []) => {
    //   languageClient.sendRequest(
    //     new RequestType<CacheParams, boolean, void>('deno/cache'),
    //     {
    //       referrer: { uri: monaco.Uri.parse('file://model.ts').toString() },
    //       uris: uris.map((uri) => ({ uri })),
    //     },
    //   );
    // });
    reader.onClose(() => languageClient.stop());
  };
}

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
  props: EditorProps & { filename: string },
) {
  const path = '/server';
  const monacoEditor = useMonaco();
  const url = useMemo(
    () =>
      createUrl(
        process.env.NEXT_PUBLIC_LSP_HOST || '',
        process.env.NEXT_PUBLIC_LSP_PORT || undefined,
        path,
      ),
    [process.env.NEXT_PUBLIC_LSP_HOST, process.env.NEXT_PUBLIC_LSP_PORT, path],
  );

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

      createWebSocket(url);
    }
  }, [monacoEditor]);

  return (
    <Editor
      defaultLanguage="typescript"
      theme="vs-light"
      options={{
        minimap: { enabled: false },
        automaticLayout: true,
      }}
      path={`file://${props.filename}.ts`}
      {...props}
    />
  );
}
