import { useEffect, useState } from "react"

import { HexedFileInput } from "../types"
import { useRecentFiles } from "./use-recent-files"

export function useResolveHandle(input: HexedFileInput) {
  const { getFileHandleById, addRecentFile } = useRecentFiles({
    loadFiles: false
  })

  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  // Load handle metadata when handleId changes
  useEffect(() => {
    if (input === null || input === undefined) {
      setFileHandle(null)
      return
    }
    if (typeof input !== "string") {
      return
    }

    const openFileHandler = async () => {
      try {
        // Load from IndexedDB handle
        const handleData = await getFileHandleById(input)
        if (handleData === null) return

        setFileHandle(handleData.handle)
      } catch (loadError) {
        console.error("Failed to load handle metadata:", loadError)
        const errorMessage =
          loadError instanceof Error ? loadError.message : "Failed to load file"
        setError(errorMessage)
        setFileHandle(null)
      }
    }

    openFileHandler()
  }, [input, getFileHandleById, addRecentFile])

  return {
    fileHandle,
    error
  }
}
