import type { BinarySnapshot } from "@hexed/types"

import type { FileManager } from "~/providers/file-manager-provider"

/**
 * Remove query parameters from a path or URL
 */
function removeQueryParams(path: string): string {
  try {
    // Handle URLs
    if (path.includes("?")) {
      return path.split("?")[0]
    }
    return path
  } catch {
    return path
  }
}

/**
 * Get the basename from a file path, removing query parameters
 */
export function getBasename(filePath: string): string {
  const pathWithoutQuery = removeQueryParams(filePath)
  return (
    pathWithoutQuery.split("/").pop() ||
    pathWithoutQuery.split("\\").pop() ||
    pathWithoutQuery
  )
}

/**
 * Format filename for display, removing query parameters
 * This is a consolidated helper for rendering filenames consistently
 */
export function formatFilenameForDisplay(filePath: string): string {
  return getBasename(filePath)
}

/**
 * Calculate checksum using SHA-256 (browser-friendly)
 */
export async function calculateChecksum(data: Uint8Array): Promise<string> {
  const buffer = new Uint8Array(data).buffer
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Create snapshot from ArrayBuffer
 */
export function createSnapshotFromArrayBuffer(
  buffer: ArrayBuffer,
  source: string
): BinarySnapshot {
  const data = new Uint8Array(buffer)
  const timestamp = Date.now()
  return {
    id: `${timestamp}-0`,
    filePath: source,
    data,
    timestamp,
    index: 0,
    label: "Baseline"
  }
}

/**
 * Type guard to check if input is a FileSystemFileHandle
 */
function isFileSystemFileHandle(
  input: File | FileSystemFileHandle
): input is FileSystemFileHandle {
  return "kind" in input && input.kind === "file"
}

/**
 * Create snapshot from FileSystemFileHandle using worker
 * If fileManager and fileId are provided, uses worker for reading
 * Otherwise falls back to direct file reading
 */
export async function createSnapshotFromHandle(
  handle: FileSystemFileHandle,
  fileManager?: FileManager | null,
  fileId?: string
): Promise<BinarySnapshot> {
  // Use worker if available
  if (fileManager && fileId) {
    try {
      // Ensure file is open in worker
      await fileManager.openFile(fileId, handle)

      // Get worker client for read operations
      const workerClient = fileManager.getWorkerClient()
      if (!workerClient) {
        throw new Error("Worker client not available")
      }

      // Get file size
      const fileSize = await workerClient.getFileSize(fileId)

      // Read entire file - readByteRange will use the current file size internally
      // to ensure we read the complete file even if it changed
      const data = await workerClient.readByteRange(fileId, 0, fileSize)

      // Verify that we read the entire file
      // Get the current file size again to check for any changes
      const currentFileSize = await workerClient.getFileSize(fileId)
      if (data.length !== currentFileSize) {
        console.warn(
          `Snapshot data length (${data.length}) does not match file size (${currentFileSize}). ` +
            `File may have changed during read. Re-reading...`
        )
        // Re-read the file to get the complete current version
        const correctedData = await workerClient.readByteRange(
          fileId,
          0,
          currentFileSize
        )
        if (correctedData.length !== currentFileSize) {
          throw new Error(
            `Failed to read complete file: expected ${currentFileSize} bytes, got ${correctedData.length}`
          )
        }
        const snapshot = createSnapshotFromArrayBuffer(
          new Uint8Array(correctedData).buffer,
          handle.name || "file"
        )
        snapshot.md5 = await calculateChecksum(snapshot.data)
        return snapshot
      }

      // Create snapshot
      const snapshot = createSnapshotFromArrayBuffer(
        new Uint8Array(data).buffer,
        handle.name || "file"
      )
      snapshot.md5 = await calculateChecksum(snapshot.data)
      return snapshot
    } catch (error) {
      console.warn(
        "Failed to read file via worker, falling back to direct read:",
        error
      )
      // Fall through to direct file reading
    }
  }

  // Fallback to direct file reading
  const file = await handle.getFile()
  return createSnapshotFromFile(file)
}

/**
 * Create snapshot from File object or FileSystemFileHandle
 * If handle and fileManager/fileId are provided, uses worker
 */
export async function createSnapshotFromFile(
  file: File | FileSystemFileHandle,
  fileManager?: FileManager | null,
  fileId?: string
): Promise<BinarySnapshot> {
  // Handle FileSystemFileHandle
  if (isFileSystemFileHandle(file)) {
    return createSnapshotFromHandle(file, fileManager, fileId)
  }

  // Handle File object (always use direct reading)
  const arrayBuffer = await file.arrayBuffer()
  const snapshot = createSnapshotFromArrayBuffer(
    arrayBuffer,
    file.name || "file"
  )
  snapshot.md5 = await calculateChecksum(snapshot.data)
  return snapshot
}

/**
 * Create snapshot from URL
 */
export async function createSnapshotFromURL(
  url: string
): Promise<BinarySnapshot> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const snapshot = createSnapshotFromArrayBuffer(arrayBuffer, url)
  snapshot.md5 = await calculateChecksum(snapshot.data)
  return snapshot
}

/**
 * Format timestamp for recent files display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
