import { useMemo, useState } from 'react';
import { getTutorialJsDocs } from '~/utils/parse-code';

/* -------------------------------------------- */
/* Types                                        */
/* -------------------------------------------- */

export type TutorialBlock = {
  isSelected: boolean;
  startLine: number;
  endLine: number;
  content: string;
  index: number;
};

const useTutorial = (code: string) => {
  /* ------------------ States ------------------ */
  const [selectedDoc, setSelectedDoc] = useState<TutorialBlock>(
    {} as TutorialBlock,
  );

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
          const range = getTutorialJsDocs({ code, jsdoc });

          return {
            ...range,
            content,
          } as TutorialBlock;
        })
        .filter((doc) => !!doc.startLine)
        .map((doc, index) => ({
          ...doc,
          index,
          isSelected: index === selectedDoc.index,
        }));

      return { jsdocs, docs };
    }

    return { jsdocs: [], docs: [] };
  }, [code, selectedDoc]);

  /* ----------------- Callbacks ---------------- */
  const onChangeSelectedDoc = (docIndex: number) => {
    if (docIndex === selectedDoc.index) {
      return setSelectedDoc({} as TutorialBlock);
    }
    console.log('docs', docs.docs[docIndex]!);

    return setSelectedDoc({ ...docs.docs[docIndex]! });
  };

  /* ------------------ Render ------------------ */
  return {
    ...docs,
    onChangeSelectedDoc,
    selectedDoc,
  };
};

export { useTutorial };
