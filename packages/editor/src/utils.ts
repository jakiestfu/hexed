import type { BinarySnapshot } from "@hexed/types"

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
 * Create snapshot from File object or FileSystemFileHandle using direct file reading
 */
export async function createSnapshotFromFile(
  file: File | FileSystemFileHandle
): Promise<BinarySnapshot> {
  // Handle FileSystemFileHandle - get File and read directly
  if (isFileSystemFileHandle(file)) {
    const fileObj = await file.getFile()
    const arrayBuffer = await fileObj.arrayBuffer()
    const snapshot = createSnapshotFromArrayBuffer(
      arrayBuffer,
      file.name || "file"
    )
    snapshot.md5 = await calculateChecksum(snapshot.data)
    return snapshot
  }

  // Handle File object - read directly
  const arrayBuffer = await file.arrayBuffer()
  const snapshot = createSnapshotFromArrayBuffer(
    arrayBuffer,
    file.name || "file"
  )
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

// Export utilities from other files
export * from "./utils/hotkey-format"
