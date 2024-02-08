'use client';

import { editorController } from '@/services/editor/controller';
import { Editor as ZipperEditor } from '@zipper/editor';
import { useMemo } from 'react';

export const Editor = ({ filename }: { filename: string }) => {
  const { get } = editorController();

  const currentFile = get('files').data.find(
    (file) => file.filename === filename,
  );

  // Missing pieces:
  // - Save buffer to local storage on ctrl+s
  // - Format on save
  // - Mark tab as dirty on change
  // - Fix editor height to fit the screen
  //   - Context: we dont want scrollbar on the page, currenly hacking using overflow-none
  return <ZipperEditor currentFile={currentFile} />;
};
