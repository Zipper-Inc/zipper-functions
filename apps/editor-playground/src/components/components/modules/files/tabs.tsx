'use client';
import { editorController } from '@/services/editor/controller';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';


export const Tabs = () => {
  const { get, onCloseFileTab } = editorController();
  const params = useSearchParams();

  const currentOpenedFile = params.get('file');

  return (
    <nav className="flex items-center gap-2 bg-green-500 h-10">
      {get('tabs').data.map((tab) => (
        <div key={tab.file_id} className='flex items-center gap-2'>
        <Link
          href={`?file=${tab.filename}`}
          className={`${
            currentOpenedFile === tab.filename && 'underline'
          }`}
        >
          {tab.filename}
         
        </Link>
        <button
            onClick={(event) => {
              event.stopPropagation();
              onCloseFileTab(tab.file_id);
            }}
          >
            <X />
          </button>
        </div>
      ))}
    </nav>
  );
};
