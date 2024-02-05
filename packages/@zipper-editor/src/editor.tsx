import { useMonaco } from '@monaco-editor/react';

import { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';

import { editor } from 'monaco-editor';
import { MonacoEditor } from './monaco-editor';

type EditorOptions = editor.IStandaloneEditorConstructionOptions;

export type EditorProps = {
  highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>;
  monaco?: {
    defaultOptions?: EditorOptions;
  };
};

export const Editor = async (props: EditorProps) => {
  return <MonacoEditor {...props} />;
};
