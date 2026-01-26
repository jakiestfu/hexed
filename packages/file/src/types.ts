/**
 * Type definitions for HexedFile
 */

export type HexedFileInput =
  | FileSystemFileHandle
  | File
  | ArrayBufferView<ArrayBuffer>
  | string
  | null
  | undefined

export type HexedFileOptions = {
  /**
   * Enable FileSystemObserver for file handles to watch for changes
   * Only works when input is a FileSystemFileHandle
   */
  watchChanges?: boolean
  /**
   * Window/chunk size for large files (default: 64KB)
   * Used for chunked loading of File and FileSystemFileHandle inputs
   */
  chunkSize?: number
}

export type ByteRange = { start: number; end: number }
