'use client'
import { editorController } from "@/services/editor/controller"
import { EditorStore } from "@/services/editor/store";
import { observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react"
import { useEffect } from "react"

export const Preview = () => {

  const { get } = editorController()

  return <p>{JSON.stringify(get('files').data, null, "\t")}</p>
}