import { Editor } from '@/components/components/modules/files/editor';
import { FilesForm } from '@/components/components/modules/files/form';
import { List } from '@/components/components/modules/files/list';
import { Tabs } from '@/components/components/modules/files/tabs';

export default function Home(props: { searchParams: { file: string } }) {
  return (
    <main className="grid grid-cols-6 h-screen">
      <div className="col-span-1 h-full p-2">
        <FilesForm />
        <List />
      </div>
      <div className="col-span-3 h-full bg-red-500 p-2">
        <Tabs />
        <Editor filename={props.searchParams.file} />
      </div>
      <div className="col-span-2 bg-purple-900 h-full">
        preview goes here
      </div>
    </main>
  );
}
