import { editor, Uri } from 'monaco-editor';
import { Editor as ReactMonacoEditor } from '@monaco-editor/react';

type EditorOptions = editor.IStandaloneEditorConstructionOptions;

export type EditorProps = {
  currentFile?: { filename: string; code: string };
  monaco?: {
    defaultOptions?: EditorOptions;
  };
};

// dummy type to think about implementation
type MonacoStore = {
  currentFile?: { filename: string; code: string };
  filenameToUri: (filename: string) => Uri;
  deleteFile: (filename: string) => void;
  renameFile: (filename: string, newFilename: string) => Uri;
  openFile: (filename: string) => void;
  save: (filename: string) => Promise<string>;
  saveAndFormat: (filename: string) => Promise<string>;
};

export const Editor = (props: EditorProps) => {
  return (
    <ReactMonacoEditor
      beforeMount={(monaco) => {
        monaco.languages.register({
          id: 'typescript',
          extensions: ['.ts', '.tsx'],
        });
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          strict: true,
          isolatedModules: true,
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true,
          resolveJsonModule: true,
          moduleResolution:
            monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          lib: ['esnext', 'dom', 'deno.ns'],
          noResolve: true,
          jsx: monaco.languages.typescript.JsxEmit.Preserve,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          disableSizeLimit: true,
        });
      }}
      defaultLanguage="typescript"
      path={props.currentFile?.filename}
      value={props.currentFile?.code}
      options={{
        minimap: { enabled: false },
        scrollbar: { vertical: 'auto', horizontal: 'hidden' },
        fixedOverflowWidgets: true,
        tabSize: 2,
        insertSpaces: false,
        fontSize: 13,
        automaticLayout: true,
        renderLineHighlight: 'none',
        scrollBeyondLastLine: false,
        ...props?.monaco?.defaultOptions,
      }}
    />
  );
};
