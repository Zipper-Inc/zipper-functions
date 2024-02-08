'use client';

import { editorController } from '@/services/editor/controller';

export const Editor = ({ filename }: { filename: string }) => {
  const { get } = editorController();

  const code = get('files').data.find((file) => file.filename === filename)?.code;

  return <code>{code}</code>
};
