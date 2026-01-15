import * as React from "react"

import { useFileData } from "./use-file-data"
import { useHandleToFile } from "./use-handle-to-file"
import { useRecentFiles } from "./use-recent-files"

/**
 * Hook for managing file loading and watching for HexEditor
 * Encapsulates all file-related state and logic
 */
export function useHexEditorFile(
  handleId: string | null,
  start?: number,
  end?: number
) {
  const { getFileHandleById, addRecentFile } = useRecentFiles({
    loadFiles: false
  })

  const [fileHandle, setFileHandle] =
    React.useState<FileSystemFileHandle | null>(null)
  const [initialLoading, setInitialLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const runIdRef = React.useRef(0)

  // Load handle metadata when handleId changes
  React.useEffect(() => {
    if (!handleId) {
      setFileHandle(null)
      setInitialLoading(false)
      setLoadError(null)
      return
    }

    const openFileHandler = async () => {
      setInitialLoading(true)
      setLoadError(null)

      try {
        // First check sessionStorage for cached snapshot (for initial fast load)
        // const snapshotKey = `hexed:pending-handle-${handleId}`
        // const cachedSnapshot = sessionStorage.getItem(snapshotKey)
        // if (cachedSnapshot) {
        //   try {
        //     // Clean up sessionStorage
        //     sessionStorage.removeItem(snapshotKey)
        //   } catch (parseError) {
        //     console.warn("Failed to parse cached snapshot:", parseError)
        //   }
        // }
        // Load from IndexedDB handle
        const handleData = await getFileHandleById(handleId)
        if (!handleData) {
          throw new Error("File handle not found or permission denied")
        }

        setFileHandle(handleData.handle)
        setInitialLoading(false)
      } catch (error) {
        console.error("Failed to load handle metadata:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load file"
        setLoadError(errorMessage)
        setFileHandle(null)
        setInitialLoading(false)
      }
    }

    openFileHandler()
  }, [handleId, getFileHandleById, addRecentFile])

  // Convert handle to File using the new hook
  const {
    file,
    loading: fileLoading,
    error: fileError
  } = useHandleToFile(fileHandle)

  // Read file data using the new hook
  const {
    data,
    loading: dataLoading,
    error: dataError
  } = useFileData(file, start, end)

  // Combine loading states
  const loading = initialLoading || fileLoading || dataLoading

  // Combine errors (load error takes precedence)
  const error = loadError || fileError || dataError

  // No-op restart function (kept for component compatibility)
  const restart = React.useCallback(() => {
    // No-op: file watching is not implemented yet
  }, [])

  return {
    snapshots: [],
    data,
    file,
    fileHandle,
    isConnected: false,
    loading,
    error,
    restart
  }
}
