export type ByteRange = { start: number; end: number } // [start, end)

const clampRange = (r: ByteRange, size: number): ByteRange => ({
  start: Math.max(0, Math.min(r.start, size)),
  end: Math.max(0, Math.min(r.end, size))
})

export class FileByteCache {
  private file: File
  private chunkSize: number
  private chunks = new Map<number, Uint8Array>() // chunkIndex -> bytes (LRU order maintained by Map insertion order)
  private rowCache = new Map<number, Uint8Array>() // rowIndex -> bytes
  private maxRowCacheSize = 200 // Maximum number of rows to cache
  private maxChunks = 50 // Maximum number of chunks to cache (~3MB with 64KB chunks)

  constructor(file: File, chunkSize = 64 * 1024) {
    this.file = file
    this.chunkSize = chunkSize
  }

  get size() {
    return this.file.size
  }

  // Fetch the minimal set of chunks needed for [start,end)
  // Returns true if new chunks were loaded, false if all chunks were already cached
  async ensureRange(
    range: ByteRange,
    opts?: { signal?: AbortSignal }
  ): Promise<boolean> {
    const { start, end } = clampRange(range, this.file.size)
    if (end <= start) return false

    const firstChunk = Math.floor(start / this.chunkSize)
    const lastChunk = Math.floor((end - 1) / this.chunkSize)

    // Evict chunks outside the requested range + buffer (keep 2x overscan)
    const bufferChunks = 10 // Keep 10 chunks on each side as buffer
    const minChunkToKeep = Math.max(0, firstChunk - bufferChunks)
    const maxChunkToKeep = Math.min(
      Math.floor(this.file.size / this.chunkSize),
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

    // If we're still over the limit, evict least recently used chunks
    while (this.chunks.size >= this.maxChunks) {
      // Remove least recently used (first entry in Map)
      const firstKey = this.chunks.keys().next().value
      if (firstKey !== undefined) {
        this.chunks.delete(firstKey)
      } else {
        break
      }
    }

    const tasks: Promise<void>[] = []
    for (let ci = firstChunk; ci <= lastChunk; ci++) {
      if (this.chunks.has(ci)) {
        // Update LRU order for chunks we're accessing
        const chunk = this.chunks.get(ci)!
        this.chunks.delete(ci)
        this.chunks.set(ci, chunk)
        continue
      }
      tasks.push(this.loadChunk(ci, opts?.signal))
    }

    // If no tasks, all chunks were already cached
    if (tasks.length === 0) return false

    // Let abort cancel outstanding loads
    await Promise.all(tasks)
    return true
  }

  readBytes(range: ByteRange): Uint8Array {
    const { start, end } = clampRange(range, this.file.size)
    if (end <= start) return new Uint8Array(0)

    const out = new Uint8Array(end - start)

    let writeOffset = 0
    let cursor = start
    while (cursor < end) {
      const chunkIndex = Math.floor(cursor / this.chunkSize)
      const chunk = this.chunks.get(chunkIndex)
      if (!chunk) {
        // Not loaded yet; caller should call ensureRange first
        break
      }

      // Update LRU order: move chunk to end (most recently used) by deleting and re-inserting
      this.chunks.delete(chunkIndex)
      this.chunks.set(chunkIndex, chunk)

      const chunkStart = chunkIndex * this.chunkSize
      const within = cursor - chunkStart
      const take = Math.min(chunk.length - within, end - cursor)

      out.set(chunk.subarray(within, within + take), writeOffset)

      cursor += take
      writeOffset += take
    }

    // If something wasn't loaded, return the portion we could fill
    return writeOffset === out.length ? out : out.subarray(0, writeOffset)
  }

  getRowBytes(rowIndex: number, bytesPerRow: number): Uint8Array {
    // Check if row is cached
    if (this.rowCache.has(rowIndex)) {
      // Move to end (most recently used) by deleting and re-inserting
      const cached = this.rowCache.get(rowIndex)!
      this.rowCache.delete(rowIndex)
      this.rowCache.set(rowIndex, cached)
      return cached
    }

    // Not cached, read bytes
    const start = rowIndex * bytesPerRow
    const end = Math.min(start + bytesPerRow, this.size)
    const bytes = this.readBytes({ start, end })

    // Cache with LRU eviction
    if (this.rowCache.size >= this.maxRowCacheSize) {
      // Remove least recently used (first entry in Map)
      const firstKey = this.rowCache.keys().next().value
      if (firstKey !== undefined) {
        this.rowCache.delete(firstKey)
      }
    }
    this.rowCache.set(rowIndex, bytes)

    return bytes
  }

  async loadChunk(chunkIndex: number, signal?: AbortSignal): Promise<void> {
    const start = chunkIndex * this.chunkSize
    const end = Math.min(start + this.chunkSize, this.file.size)

    const blob = this.file.slice(start, end)
    // Abort: Blob.arrayBuffer doesn't directly accept a signal, so we check signal before/after.
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
    const buf = await blob.arrayBuffer()
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

    // Evict if we're at the limit before adding new chunk
    if (this.chunks.size >= this.maxChunks) {
      const firstKey = this.chunks.keys().next().value
      if (firstKey !== undefined) {
        this.chunks.delete(firstKey)
      }
    }

    this.chunks.set(chunkIndex, new Uint8Array(buf))
    // Clear row cache when chunks are loaded to ensure rows reflect updated chunk data
    this.rowCache.clear()
  }

  /**
   * Check if a byte range is fully loaded in the cache
   * Returns true if all chunks covering the range are present
   */
  isRangeLoaded(range: ByteRange): boolean {
    const { start, end } = clampRange(range, this.file.size)
    if (end <= start) return true

    const firstChunk = Math.floor(start / this.chunkSize)
    const lastChunk = Math.floor((end - 1) / this.chunkSize)

    for (let ci = firstChunk; ci <= lastChunk; ci++) {
      if (!this.chunks.has(ci)) {
        return false
      }
    }

    return true
  }
}
