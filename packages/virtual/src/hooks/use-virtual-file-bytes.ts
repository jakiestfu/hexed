import { useCallback, useReducer, useRef } from "react"

type ByteRange = { start: number; end: number } // [start, end)

const clampRange = (r: ByteRange, size: number): ByteRange => ({
  start: Math.max(0, Math.min(r.start, size)),
  end: Math.max(0, Math.min(r.end, size))
})

export class FileByteCache {
  private file: File
  private chunkSize: number
  private chunks = new Map<number, Uint8Array>() // chunkIndex -> bytes
  private rowCache = new Map<number, Uint8Array>() // rowIndex -> bytes
  private maxRowCacheSize = 200 // Maximum number of rows to cache

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

    const tasks: Promise<void>[] = []
    for (let ci = firstChunk; ci <= lastChunk; ci++) {
      if (this.chunks.has(ci)) continue
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
    // console.log("readBytes", { start, end })
    if (end <= start) return new Uint8Array(0)

    const out = new Uint8Array(end - start)

    let writeOffset = 0
    let cursor = start
    while (cursor < end) {
      const chunkIndex = Math.floor(cursor / this.chunkSize)
      const chunk = this.chunks.get(chunkIndex)
      // console.log("readBytes chunk", { chunkIndex, chunk })
      if (!chunk) {
        // Not loaded yet; caller should call ensureRange first
        break
      }
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
    console.log(`loadChunk ${chunkIndex}: [${start} - ${end}]`)

    const blob = this.file.slice(start, end)
    // Abort: Blob.arrayBuffer doesn't directly accept a signal, so we check signal before/after.
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
    const buf = await blob.arrayBuffer()
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

    this.chunks.set(chunkIndex, new Uint8Array(buf))
    // Clear row cache when chunks are loaded to ensure rows reflect updated chunk data
    this.rowCache.clear()
  }
}

type UseVirtualFileBytesParams = {
  file: File | null
  bytesPerRow?: number // 16
  chunkSize?: number // cache chunk size
}

export function useVirtualFileBytes({
  file,
  bytesPerRow = 16,
  chunkSize = 64 * 1024
}: UseVirtualFileBytesParams) {
  const cacheRef = useRef<FileByteCache | null>(null)
  if (file && (!cacheRef.current || cacheRef.current["file"] !== file)) {
    cacheRef.current = new FileByteCache(file, chunkSize)
  }
  const cache = cacheRef.current

  // A tiny “version” bump to trigger rerenders when new bytes arrive.
  const [version, bump] = useReducer((n) => n + 1, 0)

  const ensureRows = useCallback(
    async (rowStart: number, rowEndInclusive: number, signal?: AbortSignal) => {
      if (!cache) return
      const byteStart = rowStart * bytesPerRow
      const byteEnd = (rowEndInclusive + 1) * bytesPerRow
      const chunksLoaded = await cache.ensureRange(
        { start: byteStart, end: byteEnd },
        { signal }
      )
      // Only bump version if new chunks were actually loaded
      if (chunksLoaded) {
        bump()
      }
    },
    [cache, bytesPerRow, bump]
  )

  const getRowBytes = useCallback(
    (rowIndex: number) => {
      if (!cache) return new Uint8Array(0)
      return cache.getRowBytes(rowIndex, bytesPerRow)
    },
    [cache, bytesPerRow, version] // version triggers re-render when chunks load, cache handles memoization
  )

  const rowCount = cache ? Math.ceil(cache.size / bytesPerRow) : 0

  return {
    rowCount,
    ensureRows,
    getRowBytes,
    fileSize: cache?.size,
    loadChunk: cache?.loadChunk
  }
}
