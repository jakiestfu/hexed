import * as React from "react"

import type { FileManager } from "../utils"
import { useRecentFiles } from "./use-recent-files"
import { useFileHandleWatcher } from "./use-file-handle-watcher"

/**
 * Hook for managing file loading and watching for HexEditor
 * Encapsulates all file-related state and logic
 */
export function useHexEditorFile(
  handleId: string | null,
  fileManager: FileManager | null
) {
  const { getFileHandleById, addRecentFile } = useRecentFiles()

  const [fileHandle, setFileHandle] =
    React.useState<FileSystemFileHandle | null>(null)
  const [filePath, setFilePath] = React.useState<string | null>(null)
  const [initialLoading, setInitialLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  // Load handle metadata when handleId changes
  React.useEffect(() => {
    if (!handleId) {
      setFileHandle(null)
      setFilePath(null)
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
            const snapshotData = JSON.parse(cachedSnapshot)
            setFilePath(snapshotData.filePath)
            // Clean up sessionStorage
            sessionStorage.removeItem(snapshotKey)
          } catch (parseError) {
            console.warn("Failed to parse cached snapshot:", parseError)
          }
        }

        // Load from IndexedDB handle
        const handleData = await getFileHandleById(handleId)
        if (!handleData) {
          throw new Error("File handle not found or permission denied")
        }

        setFilePath(handleData.handle.name)
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

        // Update recent files (will check for duplicates internally)
        addRecentFile(handleData.handle.name, "file-system", handleData.handle)
      } catch (error) {
        console.error("Failed to load handle metadata:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load file"
        setLoadError(errorMessage)
        setFilePath(null)
        setFileHandle(null)
      } finally {
        setInitialLoading(false)
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
  } = useFileHandleWatcher(fileHandle, filePath, handleId, fileManager)

  // Combine loading states
  const loading =
    initialLoading ||
    (snapshots.length === 0 && !watchError && !loadError && !!handleId)

  // Combine errors (load error takes precedence)
  const error = loadError || watchError

  return {
    snapshots,
    filePath,
    isConnected,
    loading,
    error,
    restart
  }
}
