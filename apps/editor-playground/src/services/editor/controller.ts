'use client'
import { useRouter, useSearchParams } from "next/navigation"
import { Editor, EditorStore, editorStore } from "./store"
import { useLocalStorage } from "@uidotdev/usehooks"
import { sanitizer } from "./sanitizer"

const editorController = () => {
  const router = useRouter()
  const activeFilename = useSearchParams().get('file')

  const { files, tabs } = editorStore

  const [storageFiles, setStorageFiles ] = useLocalStorage<Editor['File'][] | null>("files", null);
  const [storageTabs, setStorageTabs] = useLocalStorage<Editor['Tab'][] | null>("tabs", null);

  const tabsActions = {
    onOpenFileTab: (file_id: string) => {
      const foundOpenedTabFile = tabs.get().find(tab => tab.file_id === file_id)

      if (foundOpenedTabFile?.file_id) {
        console.log('here', foundOpenedTabFile)
        return router.replace(`file=${foundOpenedTabFile.filename}`)
      }

      const file = files.get().find(file => file.id === file_id)!
 
      const newTabFile = {
        file_id: file.id,
        filename: file.filename,
      } satisfies Editor['Tab']

      setStorageTabs([...tabs.get(), newTabFile])

      tabs.set(prev => [...prev, newTabFile])
    },

    onCloseFileTab: (file_id: string) => {
      /** all closed */
      if (tabs.get().length === 1) {
        tabs.set([])

        setStorageTabs([])
        return router.replace('/')
      }

      const foundOpenedTabFile = tabs.get().find(tab => tab.file_id === file_id)
      const openedFileIndex = tabs.get().findIndex(tab => tab.file_id === foundOpenedTabFile?.file_id)

      if (activeFilename === foundOpenedTabFile?.filename) {
        const nextTab = tabs.get()[openedFileIndex === 0 ?  1 : openedFileIndex - 1]
        
        const updatedTabs = tabs.get().filter(tab => tab.file_id !== file_id)
        
        tabs.set(updatedTabs)

        setStorageTabs(updatedTabs)
        
        return router.replace(`?file=${nextTab.filename}`)
      }

      const updatedTabs = tabs.get().filter(tab => tab.file_id !== file_id)

      setStorageTabs(updatedTabs)

      tabs.set(updatedTabs)
    }
  }

  const filesActions = {
    addNewFile: (file: Pick<Editor['File'], 'filename'>) => {
      const fileData = {
        filename: sanitizer.filename(file.filename),
        code: `export async function handler(){
          return 'hello ' + '${file.filename}'
        }`,
        id: crypto.randomUUID(),
      } satisfies Editor['File']

      const existingFile = files.get().find(_file => _file.filename === fileData.filename)

      if (existingFile) throw new Error('Invalid file name: this file already exists.')

      setStorageFiles([...files.get(), fileData])
  
      files.set(prev => [...prev, fileData])

      tabsActions.onOpenFileTab(fileData.id)

      router.replace(`?file=${fileData.filename}`)
    },

    onDeleteFile: (file_id: string) => {
      const updatedFilesData = files.get().filter(file => file.id !== file_id)

      const isOpenedFile = tabs.get().find(tab => tab.file_id)

      if (isOpenedFile && activeFilename === isOpenedFile.filename) {
        tabsActions.onCloseFileTab(isOpenedFile.file_id)
      }
      
      setStorageFiles(updatedFilesData)
      files.set(updatedFilesData)
    },

    onEditFileName: (file_id: string, new_file_name: string) => {
      const updatedFiles = files.get().map(file => {
        if (file.id === file_id) {
          return {...file, filename: new_file_name}
        }

        return file
      })

      const updatedTabs = tabs.get().map(file => {
        if (file.file_id === file_id) {
          return {...file, filename: new_file_name}
        }

        return file
      })

      const isOpenedFile = tabs.get().find(tab => tab.file_id === file_id)

      files.set(updatedFiles)
      tabs.set(updatedTabs)

      setStorageFiles(updatedFiles)
      setStorageTabs(updatedTabs)

      if (isOpenedFile && activeFilename === isOpenedFile.filename) {
        router.replace(`?file=${new_file_name}`)
      }
    },

    onSaveFile : (file_id: string, code: string) => {
      const updatedFiles = files.get().map(file => {
        if (file.id === file_id) {
          return {...file, code}
        }

        return file
      })

      files.set(updatedFiles)
      setStorageFiles(updatedFiles)
    }
  }
  
  return {
    init: () => {
      if (storageFiles?.length as number >= 1) {
        files.set(storageFiles)
      }

      if (storageTabs?.length as number >= 1) {
        tabs.set(storageTabs)
      }
    },

    get: <T extends keyof EditorStore>(key: T) => ({
      data: editorStore[key].get() as EditorStore[T]
    }),

    ...filesActions,
    ...tabsActions,
  }
}

export { editorController }