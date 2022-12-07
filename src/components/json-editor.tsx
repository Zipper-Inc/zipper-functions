import Editor, { EditorProps } from '@monaco-editor/react';

export function JSONEditor(props: EditorProps) {
  return (
    <Editor
      {...props}
      defaultLanguage="json"
      theme="vs-light"
      options={{
        minimap: { enabled: false },
        find: { enabled: false },
        lineNumbers: 'off',
        glyphMargin: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
        renderLineHighlight: false,
        ...props.options,
      }}
    />
  );
}

export function JSONViewer(props: EditorProps) {
  const value = props.value || props.defaultValue || '';
  const lines = (value.match(/\n/g) || '').length + 1;
  const height = `${(lines + 1) * 18}px`;
  return (
    <JSONEditor {...props} height={height} options={{ ...props.options }} />
  );
}

export default JSONEditor;
