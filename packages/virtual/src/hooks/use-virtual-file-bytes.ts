import { useRef, useReducer, useCallback } from "react";

type ByteRange = { start: number; end: number } // [start, end)

const clampRange = (r: ByteRange, size: number): ByteRange => ({
  start: Math.max(0, Math.min(r.start, size)),
  end: Math.max(0, Math.min(r.end, size)),
})

export class FileByteCache {
  private file: File
  private chunkSize: number
  private chunks = new Map<number, Uint8Array>() // chunkIndex -> bytes

  constructor(file: File, chunkSize = 64 * 1024) {
    this.file = file
    this.chunkSize = chunkSize
  }

  get size() {
    return this.file.size
  }

  // Fetch the minimal set of chunks needed for [start,end)
  // Returns true if new chunks were loaded, false if all chunks were already cached
  async ensureRange(range: ByteRange, opts?: { signal?: AbortSignal }): Promise<boolean> {
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
  }
}

type UseVirtualFileBytesParams = {
  file: File | null
  bytesPerRow?: number // 16
  chunkSize?: number   // cache chunk size
}

export function useVirtualFileBytes({
  file,
  bytesPerRow = 16,
  chunkSize = 64 * 1024,
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
      const chunksLoaded = await cache.ensureRange({ start: byteStart, end: byteEnd }, { signal })
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
      const start = rowIndex * bytesPerRow
      const end = Math.min(start + bytesPerRow, cache.size)
      return cache?.readBytes({ start, end })
    },
    [cache, bytesPerRow, version] // version so consumer updates when new bytes cached
  )

  const rowCount = cache ? Math.ceil(cache.size / bytesPerRow) : 0

  return { rowCount, ensureRows, getRowBytes, fileSize: cache?.size, loadChunk: cache?.loadChunk }
}