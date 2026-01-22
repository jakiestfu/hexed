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
  // Read file data using the new hook
  const {
    data,
    dataStartOffset,
    dataEndOffset,
    loading: dataLoading,
    error: dataError
  } = useFileData(file, start, end)

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
