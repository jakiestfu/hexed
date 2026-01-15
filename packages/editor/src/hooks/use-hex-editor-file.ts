import * as React from "react"

import { useFileManager } from "../providers/file-manager-provider"
import type { FileManager } from "../utils"
import { useFileHandleWatcher } from "./use-file-handle-watcher"
import { useRecentFiles } from "./use-recent-files"

/**
 * Hook for managing file loading and watching for HexEditor
 * Encapsulates all file-related state and logic
 */
// const snapshots = []
// const isConnected = false
// const watchError = null
// const restart = () => {}
export function useHexEditorFile(handleId: string | null) {
  const fileManager = useFileManager()
  const { getFileHandleById, addRecentFile } = useRecentFiles({
    loadFiles: false
  })

  const [fileHandle, setFileHandle] =
    React.useState<FileSystemFileHandle | null>(null)
  const [initialLoading, setInitialLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const runIdRef = React.useRef(0)

  // Load handle metadata when handleId changes
  console.log("USE HEX EDITOR FILE RENDER")
  React.useEffect(() => {
    if (!handleId) {
      setFileHandle(null)
      setInitialLoading(false)
      setLoadError(null)
      return
    }

    const loadHandleMetadata = async () => {
      setInitialLoading(true)
      setLoadError(null)

      try {
        // First check sessionStorage for cached snapshot (for initial fast load)
        const snapshotKey = `hexed:pending-handle-${handleId}`
        const cachedSnapshot = sessionStorage.getItem(snapshotKey)
        if (cachedSnapshot) {
          try {
            // Clean up sessionStorage
            sessionStorage.removeItem(snapshotKey)
          } catch (parseError) {
            console.warn("Failed to parse cached snapshot:", parseError)
          }
        }
        // Load from IndexedDB handle
        console.log("USE HEX EDITOR FILE LOAD HANDLE BEFORE*")
        const handleData = await getFileHandleById(handleId)
        console.log("USE HEX EDITOR FILE LOAD HANDLE AFTER*", handleData)
        if (!handleData) {
          throw new Error("File handle not found or permission denied")
        }

        setFileHandle(handleData.handle)

        // Open file in worker if file manager is available
        if (fileManager) {
          try {
            await fileManager.openFile(handleId, handleData.handle)
          } catch (workerError) {
            console.warn("Failed to open file in worker:", workerError)
            // Continue anyway, worker will be opened when watcher reads
          }
        }

        // // Update recent files (will check for duplicates internally)
        // addRecentFile(handleData.handle.name, "file-system", handleData.handle)
      } catch (error) {
        console.error("Failed to load handle metadata:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load file"
        setLoadError(errorMessage)
        setFileHandle(null)
      } finally {
        // setInitialLoading(false)
      }
    }

    loadHandleMetadata()
  }, [handleId, getFileHandleById, addRecentFile, fileManager])

  // Use file handle watcher for handle-based files
  const {
    snapshots,
    isConnected,
    error: watchError,
    restart
  } = useFileHandleWatcher(fileHandle, handleId, fileManager)

  // Combine loading states
  const loading =
    !fileHandle ||
    (snapshots.length === 0 && !watchError && !loadError && !!handleId)

  // Combine errors (load error takes precedence)
  const error = loadError || watchError

  return {
    snapshots,
    fileHandle,
    isConnected,
    loading,
    error,
    restart
  }
}
