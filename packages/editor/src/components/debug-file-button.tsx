"use client"

import { useState } from "react"

import { Button } from "@hexed/ui"

const readAndLogFileInfo = async (handle: FileSystemFileHandle) => {
  const startTime = performance.now()

  try {
    // Read file name
    const fileName = handle.name
    console.log("File name:", fileName)

    // Get file object
    const getFileStartTime = performance.now()
    const file = await handle.getFile()
    const getFileEndTime = performance.now()
    const getFileDuration = getFileEndTime - getFileStartTime
    console.log(`Time to get file object: ${getFileDuration.toFixed(2)}ms`)

    // Read file size
    const fileSize = file.size
    console.log("File size:", fileSize, "bytes")

    // Read first 1024 bytes
    const firstBytesBlob = file.slice(0, 1024)
    const firstBytesArrayBuffer = await firstBytesBlob.arrayBuffer()
    const firstBytes = new Uint8Array(firstBytesArrayBuffer)
    console.log("First 1024 bytes:", firstBytes)

    // Read last 1024 bytes
    const lastStart = Math.max(0, fileSize - 1024)
    const lastBytesBlob = file.slice(lastStart, fileSize)
    const lastBytesArrayBuffer = await lastBytesBlob.arrayBuffer()
    const lastBytes = new Uint8Array(lastBytesArrayBuffer)
    console.log("Last 1024 bytes:", lastBytes)

    const endTime = performance.now()
    const totalDuration = endTime - startTime
    console.log(`Total time to read file data: ${totalDuration.toFixed(2)}ms`)
  } catch (error) {
    console.error("Error reading file info:", error)
  }
}

export function DebugFileButton() {
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null)
  const supportsFileSystemAccess =
    typeof window !== "undefined" && "showOpenFilePicker" in window

  const handleOpenFile = async () => {
    if (!supportsFileSystemAccess || !window.showOpenFilePicker) {
      console.error("File System Access API is not supported in this browser")
      return
    }

    try {
      const [fileHandle] = await window.showOpenFilePicker({
        excludeAcceptAllOption: false,
        multiple: false
      })

      setHandle(fileHandle)
      await readAndLogFileInfo(fileHandle)
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof DOMException && error.name !== "AbortError") {
        console.error("Error opening file picker:", error)
      }
    }
  }

  const handleRelog = async () => {
    if (handle) {
      await readAndLogFileInfo(handle)
    }
  }

  const handleReset = () => {
    setHandle(null)
  }

  if (!supportsFileSystemAccess) {
    return null
  }

  if (handle) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={handleRelog}
          variant="outline"
        >
          Re-log
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
        >
          Reset
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleOpenFile}
      variant="outline"
    >
      Debug
    </Button>
  )
}
