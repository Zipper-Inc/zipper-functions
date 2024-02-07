'use client'
import { useRouter, useSearchParams } from "next/navigation"
import { Editor, EditorStore, editorStore } from "./store"

const editorController = () => {
  const router = useRouter()
  const filename = useSearchParams().get('file')
  
  return {
    init: () => {
      const storageFiles = JSON.parse(localStorage.getItem('files') as string) as Editor['File'][] 
      const storageTabs = JSON.parse(localStorage.getItem('tabs') as string) as Editor['Tab'][] 

      if (storageFiles?.length >= 1) {
        editorStore.files.set(storageFiles)
      }

      if (storageTabs?.length >= 1) {
        editorStore.tabs.set(storageTabs)
      }
    },

    get: <T extends keyof EditorStore>(key: T) => ({
      data: editorStore[key].get() as EditorStore[T]
    }),
  
    addNewFile: (file: Pick<Editor['File'], 'filename'>) => {
      const fileData = {
        ...file,
        code: `export async function handler(){}`,
        id: crypto.randomUUID(),
      } satisfies Editor['File']

      localStorage.setItem('files', JSON.stringify([...editorStore.files.get(), fileData]))
  
      editorStore.files.set(prev => [...prev, fileData])
    },

    onOpenFileTab: (file_id: string) => {
      const foundOpenedTabFile = editorStore.tabs.get().find(tab => tab.file_id === file_id)

      if (foundOpenedTabFile) {
        return router.replace(`file=${foundOpenedTabFile.filename}`)
      }

      const file = editorStore.files.get().find(file => file.id === file_id)!
 
      const newTabFile = {
        file_id: file.id,
        filename: file.filename,
      } satisfies Editor['Tab']

      localStorage.setItem('tabs', JSON.stringify([...editorStore.tabs.get(), newTabFile]))

      editorStore.tabs.set(prev => [...prev, newTabFile])
    },

    onCloseFileTab: (file_id: string) => {
      /** all closed */
      if (editorStore.tabs.get().length === 1) {
        editorStore.tabs.set([])

        localStorage.setItem('tabs', JSON.stringify([]))
        return router.replace('/')
      }

      const foundOpenedTabFile = editorStore.tabs.get().find(tab => tab.file_id === file_id)
      const openedFileIndex = editorStore.tabs.get().findIndex(tab => tab.file_id === foundOpenedTabFile?.file_id)

      if (filename === foundOpenedTabFile?.filename) {
        const nextTab = editorStore.tabs.get()[openedFileIndex === 0 ?  1 : openedFileIndex - 1]
        
        const updatedTabs = editorStore.tabs.get().filter(tab => tab.file_id !== file_id)
        
        editorStore.tabs.set(updatedTabs)

        localStorage.setItem('tabs', JSON.stringify(updatedTabs))
        
        return router.replace(`?file=${nextTab.filename}`)
      }

      const updatedTabs = editorStore.tabs.get().filter(tab => tab.file_id !== file_id)

      localStorage.setItem('tabs', JSON.stringify(updatedTabs))

      editorStore.tabs.set(updatedTabs)
    }
  }
}

export { editorController }