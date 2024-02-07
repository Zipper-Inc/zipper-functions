'use client';

import { editorController } from '@/services/editor/controller';
import { observable } from '@legendapp/state';
import { enableReactComponents } from '@legendapp/state/config/enableReactComponents';
import { Reactive } from '@legendapp/state/react';
import { useRouter } from 'next/navigation'
import React from 'react';

const formState = observable({
  filename: '',
  input: { visible: false }
})

enableReactComponents()

export const FilesForm = () => {
  const { addNewFile } = editorController();
  const router = useRouter()

  return (
    <React.Fragment>
    {formState.input.visible.get() === true ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addNewFile({ ...formState.get() });
        formState.input.visible.set(false)
        router.replace(`?file=${formState.filename.get()}`)
      }}
    >
      <Reactive.input className='border border-gray-900' $value={formState.filename} />

      <button type="submit">Add file</button>
      <button onClick={() => formState.input.visible.set(false)}>Cancel</button>
    </form>
    ) : (
      <button onClick={() => formState.input.visible.set(true)}>Add +</button>
    )}
    </React.Fragment>
  );
};
