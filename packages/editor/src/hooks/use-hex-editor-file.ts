import * as React from "react"

import { useFileData } from "./use-file-data"
import { useHandleToFile } from "./use-handle-to-file"
import { useRecentFiles } from "./use-recent-files"

export function useHandleIdToFileHandle(handleId: string | null | undefined) {
  const { getFileHandleById, addRecentFile } = useRecentFiles({
    loadFiles: false
  })

  const [fileHandle, setFileHandle] =
    React.useState<FileSystemFileHandle | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Load handle metadata when handleId changes
  React.useEffect(() => {
    if (!handleId) {
      return
    }

    const openFileHandler = async () => {
      try {
        // Load from IndexedDB handle
        const handleData = await getFileHandleById(handleId)
        if (!handleData) {
          throw new Error("File handle not found or permission denied")
        }

        console.log("setFileHandle", handleData)
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
  }, [handleId, getFileHandleById, addRecentFile])

  return {
    fileHandle: handleId ? fileHandle : null,
    error
  }
}

/**
 * Hook for managing file loading and watching for HexEditor
 * Encapsulates all file-related state and logic
 */
export function useHexEditorFile(
  file: File | null,
  start?: number,
  end?: number,
  preserveOffsets?: boolean
) {
  // const { getFileHandleById, addRecentFile } = useRecentFiles({
  //   loadFiles: false
  // })

  // const [fileHandle, setFileHandle] =
  //   React.useState<FileSystemFileHandle | null>(null)
  // const [initialLoading, setInitialLoading] = React.useState(false)
  // const [loadError, setLoadError] = React.useState<string | null>(null)
  // const runIdRef = React.useRef(0)

  // const { fileHandle, error: loadError } = useHandleIdToFileHandle(handleId)
  // Load handle metadata when handleId changes
  // React.useEffect(() => {
  //   if (!handleId) {
  //     setFileHandle(null)
  //     setInitialLoading(false)
  //     setLoadError(null)
  //     return
  //   }

  //   const openFileHandler = async () => {
  //     setInitialLoading(true)
  //     setLoadError(null)

  //     try {
  //       // First check sessionStorage for cached snapshot (for initial fast load)
  //       // const snapshotKey = `hexed:pending-handle-${handleId}`
  //       // const cachedSnapshot = sessionStorage.getItem(snapshotKey)
  //       // if (cachedSnapshot) {
  //       //   try {
  //       //     // Clean up sessionStorage
  //       //     sessionStorage.removeItem(snapshotKey)
  //       //   } catch (parseError) {
  //       //     console.warn("Failed to parse cached snapshot:", parseError)
  //       //   }
  //       // }
  //       // Load from IndexedDB handle
  //       const handleData = await getFileHandleById(handleId)
  //       if (!handleData) {
  //         throw new Error("File handle not found or permission denied")
  //       }

  //       setFileHandle(handleData.handle)
  //       setInitialLoading(false)
  //     } catch (error) {
  //       console.error("Failed to load handle metadata:", error)
  //       const errorMessage =
  //         error instanceof Error ? error.message : "Failed to load file"
  //       setLoadError(errorMessage)
  //       setFileHandle(null)
  //       setInitialLoading(false)
  //     }
  //   }

  //   openFileHandler()
  // }, [handleId, getFileHandleById, addRecentFile])

  // Convert handle to File using the new hook
  // const {
  //   file,
  //   loading: fileLoading,
  //   error: fileError
  // } = useHandleToFile(fileHandle)
  // const fileLoading = false
  // const fileError = null
  // const file = null

  // Read file data using the new hook
  const {
    data,
    dataStartOffset,
    dataEndOffset,
    loading: dataLoading,
    error: dataError
  } = useFileData(file, start, end)
  // const dataLoading = false
  // const dataStartOffset = undefined
  // const dataError = null
  // const data = null

  // Combine loading states
  const loading = dataLoading

  // Combine errors (load error takes precedence)
  const error = dataError

  // No-op restart function (kept for component compatibility)
  const restart = React.useCallback(() => {
    // No-op: file watching is not implemented yet
  }, [])

  // Return dataStartOffset when preserveOffsets is true and we have offset metadata
  const returnedDataStartOffset =
    preserveOffsets && dataStartOffset !== undefined
      ? dataStartOffset
      : undefined

  return {
    snapshots: [],
    data,
    dataStartOffset: returnedDataStartOffset,
    // file,
    // fileHandle,
    isConnected: false,
    loading,
    error,
    restart
  }
}
