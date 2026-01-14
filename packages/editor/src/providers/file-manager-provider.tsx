import * as React from "react"

import type { FileManager } from "../utils"

/**
 * Context for the file manager
 */
const FileManagerContext = React.createContext<FileManager | null>(null)

/**
 * Provider component that provides FileManager to child components
 * This allows components in the editor package to access FileManager via useFileManager hook
 */
export function FileManagerProvider({
  fileManager,
  children,
}: {
  fileManager: FileManager | null
  children: React.ReactNode
}) {
  return (
    <FileManagerContext.Provider value={fileManager}>
      {children}
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
