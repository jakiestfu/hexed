import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"

import {
  createSnapshotFromFile,
  HexEditor,
  useDragDrop,
  type FileHandleMetadata
} from "@hexed/editor"
import type { BinarySnapshot } from "@hexed/types"

import { Logo } from "~/components/logo"
import { useFileManager } from "~/providers/file-manager-provider"
import { decodeHandleId, encodeHandleId } from "~/utils/path-encoding"

export function HexEditorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { setOnFileSelect } = useDragDrop()
  const fileManager = useFileManager()

  // Get handle ID from URL parameter
  const handleId = React.useMemo(() => {
    const idParam = params.id
    if (!idParam) return null
    return decodeHandleId(idParam)
  }, [params.id])

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

  const handleHandleReady = React.useCallback(
    async (handleData: FileHandleMetadata, handleId: string) => {
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
    },
    [fileManager, navigate]
  )

  console.log("RERENDERING HEX EDITOR PAGE")

  return (
    <HexEditor
      handleId={handleId}
      onClose={handleId ? handleClose : undefined}
      onFileSelect={handleFileSelect}
      fileSource="file-system"
      originalSource={handleId ? undefined : ""}
      onHandleReady={handleHandleReady}
      fileManager={fileManager}
      logo={
        <Logo
          showHistogram={showHistogram}
          onShowHistogramChange={setShowHistogram}
        />
      }
    />
  )
}
