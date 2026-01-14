import * as React from "react"

import { FileManagerProvider as EditorFileManagerProvider } from "@hexed/editor"
import { createLogger } from "@hexed/logger"
import type { WorkerClient } from "@hexed/worker"

import { useWorkerClient } from "./worker-provider"

const logger = createLogger("file-manager-provider")

/**
 * FileManager interface for managing file operations
 */
export interface FileManager {
  openFile(fileId: string, handle: FileSystemFileHandle): Promise<void>
  closeFile(fileId: string): Promise<void>
  isFileOpen(fileId: string): boolean
  getWorkerClient(): WorkerClient | null
}

/**
 * Context for the file manager
 */
const FileManagerContext = React.createContext<FileManager | null>(null)

/**
 * Provider component that manages file operations
 * Wraps WorkerProvider and provides stable file management methods
 */
export function FileManagerProvider({
  children
}: {
  children: React.ReactNode
}) {
  const workerClient = useWorkerClient()
  const workerClientRef = React.useRef<WorkerClient | null>(null)
  const openFilesRef = React.useRef<Map<string, FileSystemFileHandle>>(
    new Map()
  )

  // Keep workerClientRef in sync with workerClient
  React.useEffect(() => {
    workerClientRef.current = workerClient
  }, [workerClient])

  const openFile = React.useCallback(
    async (fileId: string, handle: FileSystemFileHandle): Promise<void> => {
      // Check if file is already open
      if (openFilesRef.current.has(fileId)) {
        logger.log(`File ${fileId} is already open, skipping`)
        return
      }

      const client = workerClientRef.current
      if (!client) {
        logger.log("Worker client not available, cannot open file")
        throw new Error("Worker client not available")
      }

      try {
        logger.log(`Opening file: ${fileId}`)
        await client.openFile(fileId, handle)
        openFilesRef.current.set(fileId, handle)
        logger.log(`File opened successfully: ${fileId}`)
      } catch (error) {
        logger.log(`Failed to open file ${fileId}:`, error)
        throw error
      }
    },
    []
  )

  const closeFile = React.useCallback(async (fileId: string): Promise<void> => {
    const client = workerClientRef.current
    if (!client) {
      logger.log("Worker client not available, cannot close file")
      return
    }

    if (!openFilesRef.current.has(fileId)) {
      logger.log(`File ${fileId} is not open, skipping close`)
      return
    }

    try {
      logger.log(`Closing file: ${fileId}`)
      await client.closeFile(fileId)
      openFilesRef.current.delete(fileId)
      logger.log(`File closed successfully: ${fileId}`)
    } catch (error) {
      logger.log(`Failed to close file ${fileId}:`, error)
      // Still remove from map even if close fails
      openFilesRef.current.delete(fileId)
      throw error
    }
  }, [])

  const isFileOpen = React.useCallback((fileId: string): boolean => {
    return openFilesRef.current.has(fileId)
  }, [])

  const getWorkerClient = React.useCallback((): WorkerClient | null => {
    return workerClientRef.current
  }, [])

  const fileManager = React.useMemo<FileManager>(
    () => ({
      openFile,
      closeFile,
      isFileOpen,
      getWorkerClient
    }),
    [openFile, closeFile, isFileOpen, getWorkerClient]
  )

  return (
    <FileManagerContext.Provider value={fileManager}>
      <EditorFileManagerProvider fileManager={fileManager}>
        {children}
      </EditorFileManagerProvider>
    </FileManagerContext.Provider>
  )
}

/**
 * Hook to access the file manager from context
 * Returns the file manager instance or null if not available
 */
export function useFileManager(): FileManager | null {
  const fileManager = React.useContext(FileManagerContext)
  return fileManager
}
