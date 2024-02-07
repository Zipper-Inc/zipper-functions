import { observable } from '@legendapp/state';

export type Editor = {
  Tab: { file_id: string; filename: string; };
  File: { id: string; filename: string; code: string };
};

export type EditorStore = {
  tabs: Array<Editor['Tab']>;
  files: Array<Editor['File']>;
};

export const editorStore = observable<EditorStore>({
  tabs: [],
  files: [{ id: "615446dc-141e-4d90-a243-4fa63a26f166", filename: 'main.ts', code: `export async function handler(){}` }],
});
