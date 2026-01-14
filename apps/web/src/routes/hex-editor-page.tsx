import * as React from "react"
import { AlertCircle } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { createSnapshotFromFile, HexEditor, useDragDrop } from "@hexed/editor"
import type { BinarySnapshot } from "@hexed/types"
import { Button, Card, CardContent } from "@hexed/ui"

import { Logo } from "~/components/logo"
import { useFileHandleWatcher } from "~/hooks/use-file-handle-watcher"
import { useRecentFiles } from "~/hooks/use-recent-files"
import { useFileManager } from "~/providers/file-manager-provider"
import { decodeHandleId, encodeHandleId } from "~/utils/path-encoding"

export function HexEditorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { recentFiles, addRecentFile, getFileHandleById } = useRecentFiles()
  const { setOnFileSelect } = useDragDrop()
  const fileManager = useFileManager()

  // Get handle ID from URL parameter
  const hasIdParam = !!params.id
  const handleId = React.useMemo(() => {
    const idParam = params.id
    if (!idParam) return null
    return decodeHandleId(idParam)
  }, [params.id])

  // State for handle file path and loading
  const [handleFilePath, setHandleFilePath] = React.useState<string | null>(
    null
  )
  const [handleFileHandle, setHandleFileHandle] =
    React.useState<FileSystemFileHandle | null>(null)
  const [handleInitialLoading, setHandleInitialLoading] = React.useState(false)

  // Load handle metadata and set up watcher
  React.useEffect(() => {
    if (!handleId) {
      setHandleFilePath(null)
      setHandleFileHandle(null)
      setHandleInitialLoading(false)
      return
    }

    const loadHandleMetadata = async () => {
      setHandleInitialLoading(true)

      try {
        // First check sessionStorage for cached snapshot (for initial fast load)
        const snapshotKey = `hexed:pending-handle-${handleId}`
        const cachedSnapshot = sessionStorage.getItem(snapshotKey)
        if (cachedSnapshot) {
          try {
            const snapshotData = JSON.parse(cachedSnapshot)
            setHandleFilePath(snapshotData.filePath)
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

        setHandleFilePath(handleData.handle.name)
        setHandleFileHandle(handleData.handle)

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
        setHandleFilePath(null)
        setHandleFileHandle(null)
      } finally {
        setHandleInitialLoading(false)
      }
    }

    loadHandleMetadata()
  }, [handleId, getFileHandleById, addRecentFile, fileManager])

  // Use file handle watcher for handle-based files
  const {
    snapshots,
    isConnected,
    error,
    restart: handleRestart
  } = useFileHandleWatcher(handleFileHandle, handleFilePath, handleId)

  const loading = snapshots.length === 0 && !error && handleInitialLoading
  const currentSnapshot = snapshots[0] || null
  const [showHistogram, setShowHistogram] = React.useState(false)

  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
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

  const handleClose = () => {
    navigate("/")
  }

  // Callback for when a recent file is selected
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

  // Callback for when file picker is opened
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

  // Home page (no id param) - show empty state
  if (!hasIdParam) {
    return (
      <HexEditor
        snapshots={[]}
        filePath={null}
        isConnected={false}
        onFileSelect={handleFileSelect}
        recentFiles={recentFiles}
        onRecentFileSelect={handleRecentFileSelect}
        onFilePickerOpen={handleFilePickerOpen}
        logo={
          <Logo
            currentSnapshot={null}
            showHistogram={showHistogram}
            onShowHistogramChange={setShowHistogram}
          />
        }
      />
    )
  }

  // Invalid handle ID error (id param exists but decode failed)
  if (hasIdParam && !handleId) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">
                  Invalid file handle
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The file handle ID in the URL is invalid.
                </p>
              </div>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Only show full-page error if we have no snapshots (initial load error)
  // Watching errors will be shown in the popover
  if (error && snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">
                  Error loading file
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {handleFilePath}
                </p>
              </div>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <HexEditor
      snapshots={snapshots}
      filePath={handleFilePath}
      isConnected={isConnected}
      loading={loading}
      onClose={handleClose}
      fileSource="file-system"
      originalSource={handleFilePath || ""}
      error={error}
      onRestartWatching={handleRestart}
      recentFiles={recentFiles}
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
