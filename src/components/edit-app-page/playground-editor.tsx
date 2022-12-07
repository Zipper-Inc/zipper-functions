import Editor, { EditorProps, Monaco } from '@monaco-editor/react';
import denoDeclarations from '~/types/deno/d.json';

export default function PlaygroundEditor(props: EditorProps) {
  const beforeMount = (monaco: Monaco) => {
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

    // Add deno type declarations
    Object.keys(denoDeclarations).forEach((uri) => {
      const src: string = (denoDeclarations as any)[uri];
      monaco.languages.typescript.javascriptDefaults.addExtraLib(src, uri);
      monaco.editor.createModel(src, 'typescript', monaco.Uri.parse(uri));
    });
  };

  return (
    <Editor
      defaultLanguage="typescript"
      height="100vh"
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
      }}
      beforeMount={beforeMount}
      {...props}
    />
  );
}
