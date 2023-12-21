import { useMemo, useState } from 'react';
import { getJSDocEndStarLine } from '~/utils/parse-code';

/* -------------------------------------------- */
/* Types                                        */
/* -------------------------------------------- */

export type Doc = {
  isSelected: boolean;
  startLine: number;
  endLine: number;
  content: string;
  index: number;
};

const usePlaygroundDocs = (code: string) => {
  /* ------------------ States ------------------ */
  const [selectedDoc, setSelectedDoc] = useState<Doc>({} as Doc);

  /* ------------------- Memos ------------------ */
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
            /**
             * formating text from block comment to
             * markdown string
             * */
            .map((splitedLine) =>
              splitedLine.replace(/\/\*\*|\* | \*\//g, '').replace('*/', ''),
            )
            .join('\n');

          /**
           * gets start-line and end-line from each function that
           * jsdocs from block comment refers.
           */
          const range = getJSDocEndStarLine({ code, jsdoc });

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

  /* ----------------- Callbacks ---------------- */
  const onChangeSelectedDoc = (docIndex: number) => {
    if (docIndex === selectedDoc.index) {
      return setSelectedDoc({} as Doc);
    }

    return setSelectedDoc({ ...docs.docs[docIndex]! });
  };

  /* ------------------ Render ------------------ */
  return {
    ...docs,
    onChangeSelectedDoc,
    selectedDoc,
  };
};

export { usePlaygroundDocs };
