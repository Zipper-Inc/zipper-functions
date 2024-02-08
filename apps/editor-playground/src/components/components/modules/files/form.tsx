'use client';

import { editorController } from '@/services/editor/controller';
import { observable } from '@legendapp/state';
import { enableReactComponents } from '@legendapp/state/config/enableReactComponents';
import { Reactive } from '@legendapp/state/react';
import { Plus } from 'lucide-react';
import React from 'react';

const formState = observable({
  filename: '',
  input: { visible: false },
});

enableReactComponents();

export const FilesForm = () => {
  const { addNewFile } = editorController();

  return (
    <React.Fragment>
      <header className="bg-gray-100 flex items-center justify-between h-10 p-2">
        <h1 className="text-foreground">Files</h1>

        {!formState.input.visible.get() && (
          <button
            className="text-sm"
            onClick={() => formState.input.visible.set(true)}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </header>

      {formState.input.visible.get() === true && (
        <form
          className='flex items-center justify-between my-2 p-2 rounded-sm gap-2 bg-gray-100 w-full'
          onSubmit={(e) => {
            e.preventDefault();
            addNewFile({ ...formState.get() });
            formState.input.visible.set(false);
            formState.filename.set('');
          }}
        >
          <Reactive.input
            className="border border-gray-900 flex-1"
            $value={formState.filename}
          />

          <span className="flex items-center gap-1">
            <button type="submit">Add</button>
            <button onClick={() => formState.input.visible.set(false)}>
              Cancel
            </button>
          </span>
        </form>
      )}
    </React.Fragment>
  );
};
