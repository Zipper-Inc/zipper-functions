import * as monaco from 'monaco-editor';
import { MutableRefObject, useMemo, useState } from 'react';
import { getJSDocInfo } from '~/utils/parse-code';

type Doc = {
  isSelected: boolean;
  startLine: number;
  endLine: number;
  content: string;
  index: number;
};

const usePlaygroundDocs = (
  code: string,
  editorRef?: MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>,
) => {
  const [selectedDoc, setSelectedDoc] = useState<Doc>({} as Doc);

  const docs = useMemo(() => {
    if (code?.length > 1) {
      const jsdocs = code
        .split('\n')
        .reduce((acc, curr) => {
          const line = curr.trim();

          /** get only block comments lines */
          if (line.startsWith('/**') || line.startsWith('*')) {
            return [...acc, line];
          }

          return [...acc];
        }, [] as string[])
        .join('\n')
        .split('/**')
        .filter((line) => line !== '')
        .map((line) => '/**' + line);

      const docs = jsdocs
        .map((jsdoc, index) => {
          const content = jsdoc
            .split('\n')
            .filter((line) => !line.includes('/**'))
            .map((splitedLine) =>
              splitedLine.replace(/\/\*\*|\* | \*\//g, '').replace('*/', ''),
            )
            .join('\n');

          const range = getJSDocInfo({ code, jsdoc });

          return {
            ...range,
            content,
            index,
            isSelected: index === selectedDoc.index,
          } as Doc;
        })
        .filter((doc) => !!doc.startLine);

      return { jsdocs, docs };
    }

    return { jsdocs: [], docs: [] };
  }, [code, selectedDoc]);

  const onChangeSelectedDoc = (docIndex: number) => {
    if (docIndex === selectedDoc.index) {
      setSelectedDoc({} as Doc);
      return;
    }

    setSelectedDoc({ ...docs.docs[docIndex]! });
  };

  return {
    ...docs,
    onChangeSelectedDoc,
    selectedDoc,
  };
};

export { usePlaygroundDocs };
