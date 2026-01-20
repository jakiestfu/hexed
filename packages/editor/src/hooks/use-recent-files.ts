import * as React from "react"

import type { FileSource } from "../types"
import {
  clearAllFileHandles,
  deleteFileHandle,
  getAllFileHandles,
  getFileHandle,
  getFileHandleByName,
  saveFileHandle,
  updateFileHandleTimestamp,
  verifyHandlePermission,
  type FileHandleMetadata
} from "../utils/file-handle-storage"

const MAX_RECENT_FILES = 10

/**
 * Hook for managing recently opened files in IndexedDB
 */
export function useRecentFiles(
  { loadFiles = true }: { loadFiles?: boolean } = {
    loadFiles: true
  }
) {
  const [recentFiles, setRecentFiles] = React.useState<FileHandleMetadata[]>([])

  // Load recent files from IndexedDB on mount
  React.useEffect(() => {
    if (typeof window === "undefined" || !loadFiles) return

    const loadRecentFiles = async () => {
      try {
        const handles = await getAllFileHandles()
        console.log("setRecentFiles", handles)
        setRecentFiles(handles.slice(0, MAX_RECENT_FILES))
      } catch (error) {
        console.error("Failed to load recent files from IndexedDB:", error)
      }
    }

    loadRecentFiles()
  }, [loadFiles])

  const addRecentFile = React.useCallback(
    async (
      fileName: string,
      source: FileSource = "file-system",
      handle?: FileSystemFileHandle
    ): Promise<string | undefined> => {
      if (typeof window === "undefined") return undefined

      if (!handle) {
        console.error("addRecentFile requires a FileSystemFileHandle")
        return undefined
      }

      try {
        const now = Date.now()
        let handleId: string | undefined

        // Check if file already exists in IndexedDB by name
        const existingHandle = await getFileHandleByName(fileName)

        if (existingHandle) {
          // File exists - update timestamp instead of creating duplicate
          handleId = existingHandle.id

          // Check if we need to update the handle (e.g., if permission was lost)
          const hasPermission = await verifyHandlePermission(
            existingHandle.handle
          )
          if (!hasPermission) {
            // Old handle lost permission, save new one
            await deleteFileHandle(existingHandle.id)
            handleId = await saveFileHandle(handle, {
              source
            })
          } else {
            // Just update timestamp
            await updateFileHandleTimestamp(existingHandle.id, now)
          }
        } else {
          // File doesn't exist - create new entry
          handleId = await saveFileHandle(handle, {
            source
          })
        }

        // Reload handles from IndexedDB to get the updated metadata
        const handles = await getAllFileHandles()
        setRecentFiles(handles.slice(0, MAX_RECENT_FILES))

        return handleId
      } catch (error) {
        console.error("Failed to save recent file:", error)
        return undefined
      }
    },
    []
  )

  const removeRecentFile = React.useCallback(async (handleId: string) => {
    if (typeof window === "undefined") return

    try {
      await deleteFileHandle(handleId)

      // Update state
      setRecentFiles((prev) => prev.filter((file) => file.id !== handleId))
    } catch (error) {
      console.error("Failed to remove recent file:", error)
    }
  }, [])

  const clearRecentFiles = React.useCallback(async () => {
    if (typeof window === "undefined") return

    try {
      await clearAllFileHandles()
      setRecentFiles([])
    } catch (error) {
      console.error("Failed to clear recent files:", error)
    }
  }, [])

  /**
   * Get a file handle from a recent file by handleId
   */
  const getFileHandleById = React.useCallback(
    async (handleId: string): Promise<FileHandleMetadata | null> => {
      if (typeof window === "undefined") return null

      try {
        const handleData = await getFileHandle(handleId)
        if (!handleData) return null

        // Verify permission
        const hasPermission = await verifyHandlePermission(handleData.handle)
        if (!hasPermission) {
          return null
        }

        return handleData
      } catch (error) {
        console.error("Failed to get file handle:", error)
        return null
      }
    },
    []
  )

  return {
    recentFiles,
    addRecentFile,
    removeRecentFile,
    clearRecentFiles,
    getFileHandleById
  }
}
