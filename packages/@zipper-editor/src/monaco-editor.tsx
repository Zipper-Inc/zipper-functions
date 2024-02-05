'use client';

import { Editor as ReactMonacoEditor, useMonaco } from '@monaco-editor/react';
import { EditorProps } from './editor';
import { shikiToMonaco } from '@shikijs/monaco';

import { getHighlighter } from 'shiki';
import { useEffect } from 'react';
export const MonacoEditor = (props: EditorProps) => {
  const monaco = useMonaco();

  monaco?.languages.register({ id: 'typescript' });

  useEffect(() => {}, []);

  return (
    <ReactMonacoEditor
      beforeMount={async () => {
        const highlighter = await getHighlighter({
          themes: ['vitesse-dark', 'vitesse-light'],
          langs: ['javascript', 'typescript', 'vue'],
        });

        if (highlighter && monaco) {
          shikiToMonaco(highlighter, monaco);
        }
      }}
      height={'100vh'}
      defaultLanguage="typescript"
      theme="vitesse-dark"
      options={{
        ...props?.monaco?.defaultOptions,
      }}
    />
  );
};
