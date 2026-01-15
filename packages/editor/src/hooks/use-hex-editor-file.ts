import * as React from "react"

import { useFileHandleWatcher } from "./use-file-handle-watcher"
import { useRecentFiles } from "./use-recent-files"

/**
 * Hook for managing file loading and watching for HexEditor
 * Encapsulates all file-related state and logic
 */
export function useHexEditorFile(
  handleId: string | null,
  snapshotId?: string | number | null
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
      } catch (error) {
        console.error("Failed to load handle metadata:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load file"
        setLoadError(errorMessage)
        setFileHandle(null)
      }
    }

    openFileHandler()
  }, [handleId, getFileHandleById, addRecentFile])

  // Use file handle watcher for handle-based files
  const {
    snapshots,
    snapshot,
    isConnected,
    error: watchError,
    restart
  } = useFileHandleWatcher(fileHandle, snapshotId)

  // Combine loading states
  const loading =
    !fileHandle ||
    (snapshots.length === 0 && !watchError && !loadError && !!handleId)

  // Combine errors (load error takes precedence)
  const error = loadError || watchError

  return {
    snapshots,
    snapshot,
    fileHandle,
    isConnected,
    loading,
    error,
    restart
  }
}
