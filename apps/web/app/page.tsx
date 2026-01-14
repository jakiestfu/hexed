"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type { BinarySnapshot } from "@hexed/types"

import { useDragDrop } from "~/components/hex-editor/drag-drop-provider"
import { HexEditor } from "~/components/hex-editor/hex-editor"
import { useRecentFiles } from "~/hooks/use-recent-files"
import { encodeFilePath, isUrlPath } from "~/utils/path-encoding"

export default function Home() {
  const router = useRouter()
  const { recentFiles, addRecentFile } = useRecentFiles()
  const { setOnFileSelect } = useDragDrop()


  const handleFileSelect = React.useCallback(
    (input: string | BinarySnapshot) => {
      if (typeof input === "string") {
        // String path - determine source type
        // Check if it's from a recent file first
        const recentFile = recentFiles.find((file) => file.path === input)
        const source = recentFile?.source || (isUrlPath(input) ? "url" : "disk")

        addRecentFile(input, source)
        const encodedPath = encodeFilePath(input)
        router.push(`/edit/${encodedPath}`)
      } else {
        // BinarySnapshot - this should only happen from drag-drop
        // For drag-drop, we don't have a FileSystemFileHandle, so we can't watch it
        // Just navigate to a URL-encoded path or handle it differently
        const isUrl = isUrlPath(input.filePath)

        if (isUrl) {
          addRecentFile(input.filePath, "url")
          const encodedUrl = encodeFilePath(input.filePath)
          router.push(`/edit/${encodedUrl}`)
        } else {
          // Drag-drop file - can't watch it, but we can still show it
          // For now, navigate to a temporary path or show error
          // TODO: Consider if drag-drop should also save handles somehow
          console.warn('Drag-drop files cannot be watched. Consider using File System Access API picker.')
          // Still navigate but it won't be watchable
          const encodedPath = encodeFilePath(input.filePath)
          router.push(`/edit/${encodedPath}`)
        }
      }
    },
    [addRecentFile, router, recentFiles]
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
