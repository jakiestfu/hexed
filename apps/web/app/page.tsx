"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type { BinarySnapshot } from "@hexed/types"

import { useDragDrop } from "~/components/hex-editor/drag-drop-provider"
import { HexEditor } from "~/components/hex-editor/hex-editor"
import { useRecentFiles } from "~/hooks/use-recent-files"

export default function Home() {
  const router = useRouter()
  const { recentFiles, addRecentFile } = useRecentFiles()
  const { setOnFileSelect } = useDragDrop()


  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      // BinarySnapshot - this should only happen from drag-drop
      // For drag-drop, we don't have a FileSystemFileHandle, so we can't watch it
      // Just show it in the editor without navigation
      // TODO: Consider if drag-drop should also save handles somehow
      console.warn('Drag-drop files cannot be watched. Consider using File System Access API picker.')
    },
    []
  )

  // Register the file select handler with drag-drop provider
  React.useEffect(() => {
    setOnFileSelect(handleFileSelect)
    return () => {
      setOnFileSelect(null)
    }
  }, [handleFileSelect, setOnFileSelect])

  // Always show empty state - all file loading happens on /edit page
  return (
    <HexEditor
      snapshots={[]}
      filePath={null}
      isConnected={false}
      onFileSelect={handleFileSelect}
      recentFiles={recentFiles}
    />
  )
}
