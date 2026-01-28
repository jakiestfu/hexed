import type { Endianness, NumberFormat } from "./interpreter"
import {
  formatNumber as formatNumberImpl,
  readUint8 as readUint8Impl,
  readInt8 as readInt8Impl,
  readUint16 as readUint16Impl,
  readInt16 as readInt16Impl,
  readUint24 as readUint24Impl,
  readInt24 as readInt24Impl,
  readUint32 as readUint32Impl,
  readInt32 as readInt32Impl,
  readUint64 as readUint64Impl,
  readInt64 as readInt64Impl,
  readFloat16 as readFloat16Impl,
  readFloat32 as readFloat32Impl,
  readFloat64 as readFloat64Impl,
  readLEB128 as readLEB128Impl,
  readSLEB128 as readSLEB128Impl,
  readRational as readRationalImpl,
  readSRational as readSRationalImpl,
  readMSDOSDateTime as readMSDOSDateTimeImpl,
  readOLEDateTime as readOLEDateTimeImpl,
  readUnixDateTime as readUnixDateTimeImpl,
  readMacHFSDateTime as readMacHFSDateTimeImpl,
  readMacHFSPlusDateTime as readMacHFSPlusDateTimeImpl,
  readUTF8Char as readUTF8CharImpl,
  readUTF16Char as readUTF16CharImpl,
  readBinary as readBinaryImpl
} from "./interpreter"
import type { WorkerClient } from "@hexed/worker"
import { createWorkerClient } from "@hexed/worker"
import type { ByteRange, HexedFileInput, HexedFileOptions } from "./types"

type FileSystemObserver = {
  disconnect(): void
  observe(
    handle: FileSystemFileHandle | FileSystemDirectoryHandle
  ): Promise<void>
}

type FileSystemChangeRecord = {
  changedHandle: FileSystemHandle
  type: "created" | "modified" | "deleted" | "moved"
}

const clampRange = (r: ByteRange, size: number): ByteRange => ({
  start: Math.max(0, Math.min(r.start, size)),
  end: Math.max(0, Math.min(r.end, size))
})

/**
 * Unified file interface for working with files, file handles, buffers, and strings
 */
export class HexedFile extends EventTarget {
  readonly name: string
  readonly size: number
  readonly type: string | null
  readonly worker?: WorkerClient

  private input: HexedFileInput
  private options: Required<Omit<HexedFileOptions, "workerConstructor">> &
    Pick<HexedFileOptions, "workerConstructor">
  private file: File | null = null
  private fileHandle: FileSystemFileHandle | null = null
  private buffer: Uint8Array | null = null
  private chunks = new Map<number, Uint8Array>()
  private observer: FileSystemObserver | null = null
  private abortController: AbortController | null = null

  constructor(input: HexedFileInput, options?: HexedFileOptions) {
    super()

    this.input = input
    this.options = {
      watchChanges: options?.watchChanges ?? false,
      chunkSize: options?.chunkSize ?? 64 * 1024,
      workerConstructor: options?.workerConstructor
    }

    // Create worker client if workerConstructor is provided
    if (options?.workerConstructor) {
      this.worker = createWorkerClient(options.workerConstructor)
    }

    // Initialize based on input type
    if (input === null || input === undefined) {
      this.name = ""
      this.size = 0
      this.type = null
      return
    }

    if (input instanceof FileSystemFileHandle) {
      this.fileHandle = input
      this.name = input.name
      // Size and type will be set when file is loaded
      this.size = 0
      this.type = null
      // Load file asynchronously
      this.loadFileHandle()
      // Set up change watching if requested
      if (this.options.watchChanges) {
        this.setupFileWatcher()
      }
      return
    }

    if (input instanceof File) {
      this.file = input
      this.name = input.name
      this.size = input.size
      this.type = input.type || null
      return
    }

    if (ArrayBuffer.isView(input)) {
      this.buffer = new Uint8Array(
        input.buffer,
        input.byteOffset,
        input.byteLength
      )
      this.name = "buffer"
      this.size = this.buffer.length
      this.type = null
      return
    }

    if (typeof input === "string") {
      // Convert string to Uint8Array
      const encoder = new TextEncoder()
      this.buffer = encoder.encode(input)
      this.name = "string"
      this.size = this.buffer.length
      this.type = "text/plain"
      return
    }

    // Fallback
    this.name = "unknown"
    this.size = 0
    this.type = null
  }

  private async loadFileHandle(): Promise<void> {
    if (!this.fileHandle) return

    try {
      const file = await this.fileHandle.getFile()
      this.file = file
      this.size = file.size
      this.type = file.type || null
    } catch (err) {
      console.error("Failed to load file handle:", err)
    }
  }

  private setupFileWatcher(): void {
    if (!this.fileHandle || typeof FileSystemObserver === "undefined") {
      return
    }

    try {
      // @ts-expect-error - FileSystemObserver is experimental
      const observer = new FileSystemObserver(
        (records: FileSystemChangeRecord[]) => {
          if (records && records.length > 0) {
            // Reload file and emit change event
            this.loadFileHandle().then(() => {
              this.dispatchEvent(new Event("change"))
            })
          }
        }
      )

      observer.observe(this.fileHandle).then(() => {
        this.observer = observer
      })
    } catch (err) {
      console.warn("FileSystemObserver not available:", err)
    }
  }

  /**
   * Get the underlying data as Uint8Array for a given range
   * For File/FileSystemFileHandle, this requires the range to be loaded first
   */
  private getDataAtRange(range: ByteRange): Uint8Array | null {
    const { start, end } = clampRange(range, this.size)
    if (end <= start) return new Uint8Array(0)

    // If we have a buffer (ArrayBufferView or string), use it directly
    if (this.buffer) {
      if (start >= this.buffer.length) return null
      const clampedEnd = Math.min(end, this.buffer.length)
      return this.buffer.subarray(start, clampedEnd)
    }

    // If we have a file, read from chunks
    if (this.file) {
      return this.readBytesFromFile(range)
    }

    return null
  }

  private readBytesFromFile(range: ByteRange): Uint8Array | null {
    if (!this.file) return null

    const { start, end } = clampRange(range, this.file.size)
    if (end <= start) return new Uint8Array(0)

    const out = new Uint8Array(end - start)
    let writeOffset = 0
    let cursor = start

    while (cursor < end) {
      const chunkIndex = Math.floor(cursor / this.options.chunkSize)
      const chunk = this.chunks.get(chunkIndex)

      if (!chunk) {
        // Chunk not loaded - return what we have so far
        return writeOffset === out.length ? out : out.subarray(0, writeOffset)
      }

      // Update LRU order
      this.chunks.delete(chunkIndex)
      this.chunks.set(chunkIndex, chunk)

      const chunkStart = chunkIndex * this.options.chunkSize
      const within = cursor - chunkStart
      const take = Math.min(chunk.length - within, end - cursor)

      out.set(chunk.subarray(within, within + take), writeOffset)

      cursor += take
      writeOffset += take
    }

    return writeOffset === out.length ? out : out.subarray(0, writeOffset)
  }

  /**
   * Ensure a byte range is loaded (for File/FileSystemFileHandle)
   * Returns true if new chunks were loaded, false if already loaded
   */
  async ensureRange(
    range: ByteRange,
    opts?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (this.buffer) {
      // Already in memory, no need to load
      return false
    }

    if (!this.file) {
      // Try to load file handle if we have one
      if (this.fileHandle) {
        await this.loadFileHandle()
        if (!this.file) {
          return false
        }
      } else {
        return false
      }
    }

    const { start, end } = clampRange(range, this.file.size)
    if (end <= start) return false

    const firstChunk = Math.floor(start / this.options.chunkSize)
    const lastChunk = Math.floor((end - 1) / this.options.chunkSize)

    // Evict chunks outside the requested range + buffer
    const bufferChunks = 10
    const minChunkToKeep = Math.max(0, firstChunk - bufferChunks)
    const maxChunkToKeep = Math.min(
      Math.floor(this.file.size / this.options.chunkSize),
      lastChunk + bufferChunks
    )

    // Evict chunks outside the keep range
    const chunksToEvict: number[] = []
    for (const chunkIndex of this.chunks.keys()) {
      if (chunkIndex < minChunkToKeep || chunkIndex > maxChunkToKeep) {
        chunksToEvict.push(chunkIndex)
      }
    }
    for (const chunkIndex of chunksToEvict) {
      this.chunks.delete(chunkIndex)
    }

    // Evict LRU chunks if over limit
    const maxChunks = 50
    while (this.chunks.size >= maxChunks) {
      const firstKey = this.chunks.keys().next().value
      if (firstKey !== undefined) {
        this.chunks.delete(firstKey)
      } else {
        break
      }
    }

    // Cancel previous load if still in progress
    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()
    const signal = opts?.signal || this.abortController.signal

    const tasks: Promise<void>[] = []
    for (let ci = firstChunk; ci <= lastChunk; ci++) {
      if (this.chunks.has(ci)) {
        // Update LRU order
        const chunk = this.chunks.get(ci)!
        this.chunks.delete(ci)
        this.chunks.set(ci, chunk)
        continue
      }
      tasks.push(this.loadChunk(ci, signal))
    }

    if (tasks.length === 0) return false

    try {
      await Promise.all(tasks)
      return true
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name?: string }).name !== "AbortError"
      ) {
        console.error("Failed to load chunks:", err)
      }
      return false
    }
  }

  private async loadChunk(
    chunkIndex: number,
    signal: AbortSignal
  ): Promise<void> {
    if (!this.file) return

    const start = chunkIndex * this.options.chunkSize
    const end = Math.min(start + this.options.chunkSize, this.file.size)

    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }

    const blob = this.file.slice(start, end)
    const buf = await blob.arrayBuffer()

    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }

    // Evict if at limit
    const maxChunks = 50
    if (this.chunks.size >= maxChunks) {
      const firstKey = this.chunks.keys().next().value
      if (firstKey !== undefined) {
        this.chunks.delete(firstKey)
      }
    }

    this.chunks.set(chunkIndex, new Uint8Array(buf))
  }

  /**
   * Check if a byte range is fully loaded
   */
  isRangeLoaded(range: ByteRange): boolean {
    if (this.buffer) {
      // Always loaded if it's a buffer
      return true
    }

    if (!this.file) {
      return false
    }

    const { start, end } = clampRange(range, this.file.size)
    if (end <= start) return true

    const firstChunk = Math.floor(start / this.options.chunkSize)
    const lastChunk = Math.floor((end - 1) / this.options.chunkSize)

    for (let ci = firstChunk; ci <= lastChunk; ci++) {
      if (!this.chunks.has(ci)) {
        return false
      }
    }

    return true
  }

  /**
   * Read bytes at offset
   */
  readBytes(offset: number, length: number): Uint8Array | null {
    const range = { start: offset, end: offset + length }
    const data = this.getDataAtRange(range)
    return data
  }

  /**
   * Read unsigned 8-bit integer
   */
  readUint8(
    offset: number
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 1 })
    if (!data || data.length < 1) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUint8Impl(data, 0)
  }

  /**
   * Read signed 8-bit integer
   */
  readInt8(
    offset: number
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 1 })
    if (!data || data.length < 1) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readInt8Impl(data, 0)
  }

  /**
   * Read unsigned 16-bit integer
   */
  readUint16(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 2 })
    if (!data || data.length < 2) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUint16Impl(data, 0, endianness)
  }

  /**
   * Read signed 16-bit integer
   */
  readInt16(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 2 })
    if (!data || data.length < 2) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readInt16Impl(data, 0, endianness)
  }

  /**
   * Read unsigned 32-bit integer
   */
  readUint32(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 4) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUint32Impl(data, 0, endianness)
  }

  /**
   * Read signed 32-bit integer
   */
  readInt32(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 4) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readInt32Impl(data, 0, endianness)
  }

  /**
   * Read unsigned 64-bit integer
   */
  readUint64(
    offset: number,
    endianness: Endianness = "le"
  ): { value: bigint; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 8 })
    if (!data || data.length < 8) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUint64Impl(data, 0, endianness)
  }

  /**
   * Read signed 64-bit integer
   */
  readInt64(
    offset: number,
    endianness: Endianness = "le"
  ): { value: bigint; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 8 })
    if (!data || data.length < 8) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readInt64Impl(data, 0, endianness)
  }

  /**
   * Format a number as decimal or hexadecimal
   */
  formatNumber(
    value: number,
    format: NumberFormat = "dec"
  ): string {
    return formatNumberImpl(value, format)
  }

  /**
   * Read unsigned 24-bit integer
   */
  readUint24(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 3 })
    if (!data || data.length < 3) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUint24Impl(data, 0, endianness)
  }

  /**
   * Read signed 24-bit integer
   */
  readInt24(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 3 })
    if (!data || data.length < 3) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readInt24Impl(data, 0, endianness)
  }

  /**
   * Read 16-bit floating point (half precision)
   */
  readFloat16(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 2 })
    if (!data || data.length < 2) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readFloat16Impl(data, 0, endianness)
  }

  /**
   * Read 32-bit floating point
   */
  readFloat32(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 4) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readFloat32Impl(data, 0, endianness)
  }

  /**
   * Read 64-bit floating point
   */
  readFloat64(
    offset: number,
    endianness: Endianness = "le"
  ): { value: number; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 8 })
    if (!data || data.length < 8) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readFloat64Impl(data, 0, endianness)
  }

  /**
   * Read unsigned LEB128 (variable-length encoding)
   */
  readLEB128(
    offset: number
  ): { value: bigint; bytesRead: number; error: null } | { value: null; bytesRead: 0; error: string } {
    // LEB128 can be up to 10 bytes, but we'll read a reasonable chunk
    const data = this.getDataAtRange({ start: offset, end: offset + 10 })
    if (!data || data.length === 0) {
      return { value: null, bytesRead: 0, error: "Invalid offset or insufficient bytes" }
    }
    const result = readLEB128Impl(data, 0)
    return result
  }

  /**
   * Read signed LEB128 (variable-length encoding)
   */
  readSLEB128(
    offset: number
  ): { value: bigint; bytesRead: number; error: null } | { value: null; bytesRead: 0; error: string } {
    // SLEB128 can be up to 10 bytes, but we'll read a reasonable chunk
    const data = this.getDataAtRange({ start: offset, end: offset + 10 })
    if (!data || data.length === 0) {
      return { value: null, bytesRead: 0, error: "Invalid offset or insufficient bytes" }
    }
    const result = readSLEB128Impl(data, 0)
    return result
  }

  /**
   * Read unsigned rational number (numerator/denominator)
   */
  readRational(
    offset: number,
    endianness: Endianness = "le"
  ): { value: string; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 8 })
    if (!data || data.length < 8) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readRationalImpl(data, 0, endianness)
  }

  /**
   * Read signed rational number (numerator/denominator)
   */
  readSRational(
    offset: number,
    endianness: Endianness = "le"
  ): { value: string; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 8 })
    if (!data || data.length < 8) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readSRationalImpl(data, 0, endianness)
  }

  /**
   * Read MS-DOS DateTime
   */
  readMSDOSDateTime(
    offset: number,
    endianness: Endianness = "le"
  ): { value: Date; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 4) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readMSDOSDateTimeImpl(data, 0, endianness)
  }

  /**
   * Read OLE 2.0 DateTime (days since December 30, 1899)
   */
  readOLEDateTime(
    offset: number,
    endianness: Endianness = "le"
  ): { value: Date; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 8 })
    if (!data || data.length < 8) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readOLEDateTimeImpl(data, 0, endianness)
  }

  /**
   * Read UNIX 32-bit DateTime (seconds since January 1, 1970)
   */
  readUnixDateTime(
    offset: number,
    endianness: Endianness = "le"
  ): { value: Date; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 4) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUnixDateTimeImpl(data, 0, endianness)
  }

  /**
   * Read Macintosh HFS DateTime (seconds since January 1, 1904)
   */
  readMacHFSDateTime(
    offset: number,
    endianness: Endianness = "le"
  ): { value: Date; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 4) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readMacHFSDateTimeImpl(data, 0, endianness)
  }

  /**
   * Read Macintosh HFS+ DateTime (seconds since January 1, 1904)
   */
  readMacHFSPlusDateTime(
    offset: number,
    endianness: Endianness = "le"
  ): { value: Date; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 4) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readMacHFSPlusDateTimeImpl(data, 0, endianness)
  }

  /**
   * Read UTF-8 character
   */
  readUTF8Char(
    offset: number
  ): { value: string; error: null } | { value: null; error: string } {
    // UTF-8 can be 1-4 bytes, read up to 4 bytes
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length === 0) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUTF8CharImpl(data, 0)
  }

  /**
   * Read UTF-16 character
   */
  readUTF16Char(
    offset: number,
    endianness: Endianness = "le"
  ): { value: string; error: null } | { value: null; error: string } {
    // UTF-16 can be 2 or 4 bytes (for surrogate pairs), read up to 4 bytes
    const data = this.getDataAtRange({ start: offset, end: offset + 4 })
    if (!data || data.length < 2) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readUTF16CharImpl(data, 0, endianness)
  }

  /**
   * Read binary representation (8 bits)
   */
  readBinary(
    offset: number
  ): { value: string; error: null } | { value: null; error: string } {
    const data = this.getDataAtRange({ start: offset, end: offset + 1 })
    if (!data || data.length < 1) {
      return { value: null, error: "Invalid offset or insufficient bytes" }
    }
    return readBinaryImpl(data, 0)
  }

  /**
   * Get the FileSystemFileHandle if this instance was created from one
   */
  getHandle(): FileSystemFileHandle | null {
    return this.fileHandle ?? null
  }

  /**
   * Get the File if this instance was created from one
   */
  getFile(): File | null {
    return this.file ?? null
  }

  /**
   * Get file size (method form for consistency in worker context)
   */
  fileSize(): number {
    return this.size
  }

  /**
   * Iterate over file in chunks, calling callback for each chunk
   */
  async forEachChunk(
    chunkSize: number,
    callback: (chunk: Uint8Array) => void | Promise<void>,
    options?: { signal?: AbortSignal }
  ): Promise<void> {
    const size = this.size
    let offset = 0

    while (offset < size) {
      // Check abort signal
      if (options?.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError")
      }

      const end = Math.min(offset + chunkSize, size)
      const range = { start: offset, end }

      // Ensure range is loaded
      if (!this.isRangeLoaded(range)) {
        await this.ensureRange(range, { signal: options?.signal })
      }

      // Read chunk
      const chunk = this.getDataAtRange(range)
      if (chunk && chunk.length > 0) {
        await callback(chunk)
      }

      offset = end

      // Yield to event loop periodically for responsiveness
      if (offset % (chunkSize * 10) === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
  }

  /**
   * Cleanup resources
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    if (this.worker) {
      this.worker.disconnect()
    }
  }
}
