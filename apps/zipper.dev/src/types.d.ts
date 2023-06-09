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

declare module 'next-auth' {
  import type { DefaultUser } from 'next-auth';
  interface Session {
    user?: DefaultUser & {
      id: string;
    };
  }
}
