'use client';

import { editorController } from '@/services/editor/controller';
import { observable } from '@legendapp/state';
import { enableReactComponents } from '@legendapp/state/config/enableReactComponents';
import { Reactive } from '@legendapp/state/react';
import { Plus } from 'lucide-react';
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
    <header className='bg-gray-100 flex items-center justify-between p-2 h-10'>
      <h1 className='text-foreground'>Files</h1>
      {formState.input.visible.get() === true ? (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addNewFile({ ...formState.get() });
          formState.input.visible.set(false)
          formState.filename.set('')
        }}
      >
        <Reactive.input className='border border-gray-900' $value={formState.filename} />
  
        <button type="submit">Add file</button>
        <button onClick={() => formState.input.visible.set(false)}>Cancel</button>
      </form>
      ) : (
        <button className='text-sm' onClick={() => formState.input.visible.set(true)}><Plus className='w-4 h-4' /></button>
      )}
    </header>
  );
};
