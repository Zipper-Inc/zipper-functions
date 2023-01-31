import { useEffect, useRef } from 'react';

function usePrettier() {
  const prettierRef = useRef<any>(null);
  const prettierParserBabel = useRef<any>(null);

  // dynamically load prettier deps
  useEffect(() => {
    if (!prettierRef.current)
      import('prettier/standalone').then((p) => {
        prettierRef.current = p;
      });

    if (!prettierParserBabel.current)
      import('prettier/parser-babel').then((p) => {
        prettierParserBabel.current = p;
      });
  }, []);

  return (source: string, cursorOffset = 0) => {
    let result = { formatted: source, cursorOffset };

    if (prettierRef.current && prettierParserBabel.current) {
      try {
        result = prettierRef.current.formatWithCursor(source, {
          parser: 'babel',
          plugins: [prettierParserBabel.current],
        });
      } catch (e) {
        console.error('Prettier error', e);
      }
    }

    return result;
  };
}
export default usePrettier;
