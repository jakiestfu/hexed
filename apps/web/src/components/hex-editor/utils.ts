import type { BinarySnapshot } from "@hexed/types"
import type { WorkerClient } from "@hexed/worker"

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
  return 'kind' in input && input.kind === 'file'
}

/**
 * Create snapshot from FileSystemFileHandle using worker
 * If workerClient and fileId are provided, uses worker for reading
 * Otherwise falls back to direct file reading
 */
export async function createSnapshotFromHandle(
  handle: FileSystemFileHandle,
  workerClient?: WorkerClient | null,
  fileId?: string
): Promise<BinarySnapshot> {
  // Use worker if available
  if (workerClient && fileId) {
    try {
      // Ensure file is open in worker
      await workerClient.openFile(fileId, handle)
      
      // Get file size
      const fileSize = await workerClient.getFileSize(fileId)
      
      // Read entire file
      const data = await workerClient.readByteRange(fileId, 0, fileSize)
      
      // Create snapshot
      const snapshot = createSnapshotFromArrayBuffer(
        data.buffer,
        handle.name || "file"
      )
      snapshot.md5 = await calculateChecksum(snapshot.data)
      return snapshot
    } catch (error) {
      console.warn('Failed to read file via worker, falling back to direct read:', error)
      // Fall through to direct file reading
    }
  }

  // Fallback to direct file reading
  const file = await handle.getFile()
  return createSnapshotFromFile(file)
}

/**
 * Create snapshot from File object or FileSystemFileHandle
 * If handle and workerClient/fileId are provided, uses worker
 */
export async function createSnapshotFromFile(
  file: File | FileSystemFileHandle,
  workerClient?: WorkerClient | null,
  fileId?: string
): Promise<BinarySnapshot> {
  // Handle FileSystemFileHandle
  if (isFileSystemFileHandle(file)) {
    return createSnapshotFromHandle(file, workerClient, fileId)
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
