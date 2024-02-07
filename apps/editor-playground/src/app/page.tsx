import { FilesForm } from '@/components/components/modules/files/form';
import { List } from '@/components/components/modules/files/list';
import { Tabs } from '@/components/components/modules/files/tabs';
import { editorController } from '@/services/editor/controller';
import { useObserve, useObservable, Reactive } from '@legendapp/state/react';
import Image from 'next/image';

export default function Home() {
  return (
    <main className='flex items-start'>
      <div className="max-w-lg">
        <FilesForm />
        <List />
      </div>
      <Tabs />
    </main>
  );
}
