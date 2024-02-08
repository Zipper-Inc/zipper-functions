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
    <nav className="flex items-center gap-2 h-10 border-b border-border">
      {get('tabs').data.map((tab) => {
        const isActiveTab = currentOpenedFile === tab.filename;
        return (
          <div
            key={tab.file_id}
            className={`flex group items-center relative gap-2 p-2 h-full ${
              isActiveTab && 'bg-primary-purple-50 text-primary'
            }`}
          >
            <Link
              href={`?file=${tab.filename}`}
            >
              {tab.filename}
            </Link>
            <button
              className={`${!isActiveTab && ' transition-all invisible group-hover:visible'}`}
              onClick={(event) => {
                event.stopPropagation();
                onCloseFileTab(tab.file_id);
              }}
            >
              <X className={isActiveTab ? 'fill-primary' : undefined} size={16} />
            </button>
            {isActiveTab && (
              <span className="bg-primary w-full h-px absolute left-0 bottom-0" />
            )}
          </div>
        );
      })}
    </nav>
  );
};
