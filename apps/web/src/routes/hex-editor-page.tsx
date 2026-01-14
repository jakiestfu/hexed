import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"

import {
  createSnapshotFromFile,
  HexEditor,
  useDragDrop,
  useRecentFiles
} from "@hexed/editor"
import type { BinarySnapshot } from "@hexed/types"

import { Logo } from "~/components/logo"
import { useHexEditorFile } from "~/hooks/use-hex-editor-file"
import { useFileManager } from "~/providers/file-manager-provider"
import { decodeHandleId, encodeHandleId } from "~/utils/path-encoding"

export function HexEditorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { addRecentFile, getFileHandleById } = useRecentFiles()
  const { setOnFileSelect } = useDragDrop()
  const fileManager = useFileManager()

  // Get handle ID from URL parameter
  const handleId = React.useMemo(() => {
    const idParam = params.id
    if (!idParam) return null
    return decodeHandleId(idParam)
  }, [params.id])

  // Use hook to manage file loading and watching
  const { snapshots, filePath, isConnected, loading, error, restart } =
    useHexEditorFile(handleId)

  const currentSnapshot = snapshots[0] || null
  const [showHistogram, setShowHistogram] = React.useState(false)

  // Memoized callbacks
  const handleClose = React.useCallback(() => {
    navigate("/")
  }, [navigate])

  const handleFileSelect = React.useCallback(
    (_input: string | BinarySnapshot) => {
      // BinarySnapshot - this should only happen from drag-drop
      // For drag-drop, we don't have a FileSystemFileHandle, so we can't watch it
      // Just show it in the editor without navigation
      // TODO: Consider if drag-drop should also save handles somehow
      if (handleId) {
        // If we're on edit page, navigate to home
        navigate("/")
      } else {
        console.warn(
          "Drag-drop files cannot be watched. Consider using File System Access API picker."
        )
      }
    },
    [handleId, navigate]
  )

  // Register the file select handler with drag-drop provider
  React.useEffect(() => {
    setOnFileSelect(handleFileSelect)
    return () => {
      setOnFileSelect(null)
    }
  }, [handleFileSelect, setOnFileSelect])

  const handleRecentFileSelect = React.useCallback(
    async (handleId: string) => {
      try {
        const handleData = await getFileHandleById(handleId)
        if (!handleData) {
          throw new Error("File handle not found or permission denied")
        }

        // Open file in worker if file manager is available
        if (fileManager) {
          try {
            await fileManager.openFile(handleId, handleData.handle)
          } catch (workerError) {
            console.warn("Failed to open file in worker:", workerError)
            // Continue anyway, will fall back to direct reading
          }
        }

        // Create snapshot using worker if available
        const snapshot = await createSnapshotFromFile(
          handleData.handle,
          fileManager || null,
          handleId
        )
        const snapshotKey = `hexed:pending-handle-${handleId}`
        try {
          // Store snapshot data (convert Uint8Array to array for JSON)
          const snapshotData = {
            ...snapshot,
            data: Array.from(snapshot.data)
          }
          sessionStorage.setItem(snapshotKey, JSON.stringify(snapshotData))
        } catch (storageError) {
          console.warn(
            "Failed to store snapshot in sessionStorage:",
            storageError
          )
        }

        // Navigate to edit page with handleId
        const encodedHandleId = encodeHandleId(handleId)
        navigate(`/edit/${encodedHandleId}`)
      } catch (error) {
        console.error("Error reopening file handle:", error)
        alert("Could not reopen file. Please select it again.")
        throw error
      }
    },
    [getFileHandleById, fileManager, navigate]
  )

  const handleFilePickerOpen = React.useCallback(async () => {
    const supportsFileSystemAccess =
      typeof window !== "undefined" && "showOpenFilePicker" in window

    if (!supportsFileSystemAccess || !window.showOpenFilePicker) {
      alert("File System Access API is not supported in this browser")
      return null
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        excludeAcceptAllOption: false,
        multiple: false
      })

      // Save handle and get handleId
      const handleId = await addRecentFile(handle.name, "file-system", handle)

      if (handleId) {
        // Open file in worker if file manager is available
        if (fileManager) {
          try {
            await fileManager.openFile(handleId, handle)
          } catch (workerError) {
            console.warn("Failed to open file in worker:", workerError)
            // Continue anyway, worker will be opened when page loads
          }
        }

        // Navigate to edit page with handleId
        const encodedHandleId = encodeHandleId(handleId)
        navigate(`/edit/${encodedHandleId}`)
        return handleId
      } else {
        console.error("Failed to save file handle")
        alert("Failed to save file handle. Please try again.")
        return null
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof DOMException && error.name !== "AbortError") {
        console.error("Error opening file picker:", error)
        alert("Failed to open file. Please try again.")
      }
      return null
    }
  }, [addRecentFile, fileManager, navigate])

  console.log("RERENDERING HEX EDITOR PAGE")
  return (
    <HexEditor
      snapshots={snapshots}
      filePath={filePath}
      isConnected={isConnected}
      loading={loading}
      onClose={handleId ? handleClose : undefined}
      onFileSelect={handleFileSelect}
      fileSource="file-system"
      originalSource={filePath || ""}
      error={error}
      onRestartWatching={restart}
      onRecentFileSelect={handleRecentFileSelect}
      onFilePickerOpen={handleFilePickerOpen}
      logo={
        <Logo
          currentSnapshot={currentSnapshot}
          showHistogram={showHistogram}
          onShowHistogramChange={setShowHistogram}
        />
      }
    />
  )
}
