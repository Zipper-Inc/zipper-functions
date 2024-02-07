'use client'
import { editorController } from "@/services/editor/controller"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export const List = () => {
  const { init, get, onOpenFileTab } = editorController()

  init()

  const params = useSearchParams();

  const currentOpenedFile = params.get('file');

  return (
    <nav className="flex flex-col">
      {get('files').data.map(file => (
        <Link href={`?file=${file.filename}`} onClick={() => onOpenFileTab(file.id)} className={`${
          currentOpenedFile === file.filename && 'underline'
        } p-2 hover:underline`} key={file.id}>{file.filename}</Link>
      ))}
    </nav>
  )
}