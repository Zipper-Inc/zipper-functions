declare module 'monaco-jsx-highlighter' {
  import MonacoJsxHighlighter from 'monaco-jsx-highlighter';

  // biome-ignore lint/suspicious/noRedeclare: <explanation>
  export default class MonacoJsxHighlighter {
    constructor(monaco: any, parse: any, traverse: any, editor: any);

    highlightOnDidChangeModelContent(debounceMs: number): void;
    addJSXCommentCommand(): void;
  }
}

// Utility type for adding parameters to an existing function type
declare type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any],
> = (
  ...args: [...Parameters<TFunction>, ...TParameters]
) => ReturnType<TFunction>;
