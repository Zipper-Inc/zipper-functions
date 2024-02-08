'use client';
import { editorController } from '@/services/editor/controller';
import { observable } from '@legendapp/state';
import { Reactive, useObservable } from '@legendapp/state/react';
import { enableReactComponents } from '@legendapp/state/config/enableReactComponents';
import { Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const formState = observable({
  filename: '',
  file_id: '',
});

enableReactComponents();

export const List = () => {
  const { init, get, onOpenFileTab, onDeleteFile, onEditFileName } =
    editorController();

  init();

  const params = useSearchParams();

  const currentOpenedFile = params.get('file');

  const state = {
    filename: formState.filename.get(),
    file_id: formState.file_id.get()
  }
  
  return (
    <nav className="flex flex-col">
      {get('files').data.map((file) => (
        <div
          key={file.id}
          className="group h-8 relative flex items-center justify-between p-2"
        >
          {state.file_id === file.id ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onEditFileName(file.id, formState.filename.get());

                formState.file_id.set('');
                formState.filename.set('');
              }}
              className="flex items-center justify-between"
            >
              <Reactive.input
                $value={formState.filename}
                placeholder={file.filename}
              />
              <button type="submit">Save</button>
              <button onClick={() => formState.file_id.set('')}>Cancel</button>
            </form>
          ) : (
            <Link
              href={`?file=${file.filename}`}
              onClick={() => onOpenFileTab(file.id)}
              className={`${
                currentOpenedFile === file.filename && 'underline'
              } hover:underline flex-1`}
            >
              {file.filename}
            </Link>
          )}

          <span className="w-12 hidden group-hover:flex items-center gap-2 bg-white p-2">
            <button onClick={() => formState.file_id.set(file.id)}>
              <Edit size={12} />
            </button>
            <button onClick={() => onDeleteFile(file.id)}>
              <Trash size={12} />
            </button>
          </span>
        </div>
      ))}
    </nav>
  );
};
