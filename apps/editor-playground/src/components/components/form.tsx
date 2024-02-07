'use client';

import { editorController } from '@/services/editor/controller';
import { enableReactComponents } from '@legendapp/state/config/enableReactComponents';
import { useObservable } from '@legendapp/state/react';
import { FormEvent } from 'react';

enableReactComponents();

export const AddNewFileForm = () => {
  const { addNewFile } = editorController();

  const data = useObservable({ filename: '', code: '' });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addNewFile({ ...data.get() });
  };

  return (
    <form onSubmit={onSubmit}>
      <input onChange={(e) => data.filename.set(e.target.value)} />
      <input onChange={(e) => data.code.set(e.target.value)} />

      <button type="submit">Add file</button>
    </form>
  );
};
