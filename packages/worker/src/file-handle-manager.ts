/**
 * Manages FileSystemFileHandle instances and provides byte range reading
 */

export interface FileHandleInfo {
  handle: FileSystemFileHandle
  size: number | null
  lastAccessed: number
}

export class FileHandleManager {
  private handles = new Map<string, FileHandleInfo>()

  /**
   * Register a file handle
   */
  async openFile(fileId: string, handle: FileSystemFileHandle): Promise<void> {
    const file = await handle.getFile()
    const info: FileHandleInfo = {
      handle,
      size: file.size,
      lastAccessed: Date.now()
    }
    this.handles.set(fileId, info)
  }

  /**
   * Check if a file is open
   */
  hasFile(fileId: string): boolean {
    return this.handles.has(fileId)
  }

  /**
   * Get file size, fetching if not cached
   */
  async getFileSize(fileId: string): Promise<number> {
    const info = this.handles.get(fileId)
    if (!info) {
      throw new Error(`File ${fileId} is not open`)
    }

    // Update file size in case it changed
    const file = await info.handle.getFile()
    info.size = file.size
    info.lastAccessed = Date.now()

    return file.size
  }

  /**
   * Read a byte range from a file
   */
  async readByteRange(
    fileId: string,
    start: number,
    end: number
  ): Promise<Uint8Array> {
    const info = this.handles.get(fileId)
    if (!info) {
      throw new Error(`File ${fileId} is not open`)
    }

    // Get file and validate range
    const file = await info.handle.getFile()
    const fileSize = file.size

    // Clamp range to file bounds
    const clampedStart = Math.max(0, Math.min(start, fileSize))

    // If end >= fileSize, read the entire file from start to the end
    // This ensures we always read the complete file when requested
    const clampedEnd =
      end >= fileSize
        ? fileSize
        : Math.max(clampedStart, Math.min(end, fileSize))

    if (clampedStart >= fileSize) {
      return new Uint8Array(0)
    }

    // Read the byte range using File.slice()
    // Note: File.slice() is exclusive of end, so slice(0, fileSize) reads bytes 0 to fileSize-1
    // which is exactly fileSize bytes
    const blob = file.slice(clampedStart, clampedEnd)
    const arrayBuffer = await blob.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    // Update last accessed time
    info.lastAccessed = Date.now()
    info.size = fileSize // Update size in case it changed

    return data
  }

  /**
   * Close a file handle
   */
  closeFile(fileId: string): void {
    this.handles.delete(fileId)
  }

  /**
   * Get all open file IDs
   */
  getOpenFileIds(): string[] {
    return Array.from(this.handles.keys())
  }
}
