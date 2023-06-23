declare module 'monaco-jsx-highlighter' {
  import MonacoJsxHighlighter from 'monaco-jsx-highlighter';

  export default class MonacoJsxHighlighter {
    constructor(
      monaco: any,
      parse: any,
      traverse: any,
      editor: any,
    ): MonacoJsxHighlighter;

    highlightOnDidChangeModelContent(debounceMs: number): void;
    addJSXCommentCommand(): void;
  }
}
