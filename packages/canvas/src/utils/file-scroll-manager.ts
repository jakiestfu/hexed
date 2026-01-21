import type { LayoutMetrics } from "./coordinates"
import { FileByteCache } from "./file-byte-cache"

type ByteRange = { start: number; end: number }

type ScrollTopRef = { current: number | null | undefined }

export class FileScrollManager {
  private file: File | null = null
  private cache: FileByteCache | null = null
  private scrollTopRef: ScrollTopRef
  private layout: LayoutMetrics | null = null
  private dimensions: { width: number; height: number } = {
    width: 0,
    height: 0
  }
  private bytesPerRow: number = 16
  private chunkSize: number = 64 * 1024

  // Internal state (not React state) - exposed via refs for reading
  public readonly visibleByteRangeRef: { current: ByteRange } = {
    current: { start: 0, end: 0 }
  }
  public readonly loadedBytesRef: { current: Uint8Array } = {
    current: new Uint8Array(0)
  }
  // Version counter to signal when data changes (for React to detect)
  public readonly dataVersionRef: { current: number } = { current: 0 }
  private rafId: number | null = null
  private abortController: AbortController | null = null
  private lastLoadedRange: ByteRange | null = null

  constructor(params: {
    file: File | null
    scrollTopRef: ScrollTopRef
    bytesPerRow: number
    chunkSize?: number
  }) {
    this.scrollTopRef = params.scrollTopRef
    this.bytesPerRow = params.bytesPerRow
    this.chunkSize = params.chunkSize ?? 64 * 1024
    this.setFile(params.file)
    this.startRafLoop()
  }

  setFile(file: File | null): void {
    if (this.file === file) return

    this.file = file
    if (file) {
      this.cache = new FileByteCache(file, this.chunkSize)
      // Reset last loaded range so we reload chunks
      this.lastLoadedRange = null
      // Trigger update to load initial chunks
      this.triggerUpdate()
    } else {
      this.cache = null
      this.visibleByteRangeRef.current = { start: 0, end: 0 }
      this.loadedBytesRef.current = new Uint8Array(0)
      this.lastLoadedRange = null
    }
  }

  setLayout(layout: LayoutMetrics | null): void {
    this.layout = layout
    if (layout) {
      this.bytesPerRow = layout.bytesPerRow
    }
    // Trigger immediate update when layout is set
    this.triggerUpdate()
  }

  setDimensions(dimensions: { width: number; height: number }): void {
    this.dimensions = dimensions
    // Trigger immediate update when dimensions are set
    this.triggerUpdate()
  }

  private triggerUpdate(): void {
    // Only update if we have the necessary data
    if (!this.layout || !this.cache || this.dimensions.height === 0) {
      return
    }

    // Force a recalculation and chunk load
    const newVisibleRange = this.calculateVisibleByteRange()
    const rangeChanged =
      newVisibleRange.start !== this.visibleByteRangeRef.current.start ||
      newVisibleRange.end !== this.visibleByteRangeRef.current.end

    // Update if range changed or if we haven't loaded anything yet
    if (rangeChanged || this.loadedBytesRef.current.length === 0) {
      this.visibleByteRangeRef.current = newVisibleRange
      // Only load chunks if we have a valid range
      if (newVisibleRange.end > newVisibleRange.start) {
        // Load chunks asynchronously
        this.loadChunksForRange(newVisibleRange).then(() => {
          this.updateLoadedBytes()
        })
      }
      // Update loaded bytes immediately with what we have
      this.updateLoadedBytes()
    }
  }

  getVisibleByteRange(): ByteRange {
    return this.visibleByteRangeRef.current
  }

  getLoadedBytes(): Uint8Array {
    return this.loadedBytesRef.current
  }

  getScrollTop(): number {
    return this.scrollTopRef.current ?? 0
  }

  getFileSize(): number | undefined {
    return this.cache?.size
  }

  scrollToOffset(offset: number): void {
    if (!this.layout) return

    const rowIndex = Math.floor(offset / this.layout.bytesPerRow)
    const rowTop =
      rowIndex * this.layout.rowHeight + this.layout.verticalPadding
    const targetScrollTop =
      rowTop + this.layout.rowHeight / 2 - this.dimensions.height / 2
    const clampedScrollTop = Math.max(0, targetScrollTop)

    if (this.scrollTopRef.current !== undefined) {
      this.scrollTopRef.current = clampedScrollTop
    }
  }

  private calculateVisibleByteRange(): ByteRange {
    if (!this.layout || !this.cache) {
      return { start: 0, end: 0 }
    }

    const scrollTop = this.scrollTopRef.current ?? 0
    const scrollTopAdjusted = Math.max(
      0,
      scrollTop - (this.layout.verticalPadding ?? 0)
    )
    const startRow = Math.floor(scrollTopAdjusted / this.layout.rowHeight)
    const endRow = Math.ceil(
      (scrollTopAdjusted + this.dimensions.height) / this.layout.rowHeight
    )

    const startByte = startRow * this.bytesPerRow
    const endByte = Math.min(endRow * this.bytesPerRow, this.cache.size)

    return { start: startByte, end: endByte }
  }

  private async loadChunksForRange(range: ByteRange): Promise<void> {
    if (!this.cache || !this.layout) return

    // Add overscan (5 rows)
    const overscan = this.bytesPerRow * 5
    const startByte = Math.max(0, range.start - overscan)
    const endByte = Math.min(this.cache.size, range.end + overscan)

    // Check if we already loaded this exact range (or a superset)
    // We need to load if:
    // 1. No range was loaded before, OR
    // 2. The requested range extends beyond what we've loaded
    const needsLoad =
      !this.lastLoadedRange ||
      startByte < this.lastLoadedRange.start ||
      endByte > this.lastLoadedRange.end

    if (!needsLoad) {
      return
    }

    // Cancel previous load if still in progress
    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()

    try {
      await this.cache.ensureRange(
        { start: startByte, end: endByte },
        { signal: this.abortController.signal }
      )
      // Update lastLoadedRange to the union of old and new ranges
      if (this.lastLoadedRange) {
        this.lastLoadedRange = {
          start: Math.min(this.lastLoadedRange.start, startByte),
          end: Math.max(this.lastLoadedRange.end, endByte)
        }
      } else {
        this.lastLoadedRange = { start: startByte, end: endByte }
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name?: string }).name !== "AbortError"
      ) {
        console.error("Failed to load chunks:", err)
      }
    }
  }

  private updateLoadedBytes(): void {
    if (!this.cache || !this.layout) {
      this.loadedBytesRef.current = new Uint8Array(0)
      this.dataVersionRef.current++
      return
    }

    const { start, end } = this.visibleByteRangeRef.current
    const startRow = Math.floor(start / this.bytesPerRow)
    const endRow = Math.ceil(end / this.bytesPerRow)

    const bytes: number[] = []
    for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
      const rowBytes = this.cache.getRowBytes(rowIndex, this.bytesPerRow)
      bytes.push(...Array.from(rowBytes))
    }

    const newBytes = new Uint8Array(bytes)
    // Only increment version if bytes actually changed
    const bytesChanged =
      newBytes.length !== this.loadedBytesRef.current.length ||
      !newBytes.every((b, i) => b === this.loadedBytesRef.current[i])

    this.loadedBytesRef.current = newBytes
    if (bytesChanged) {
      this.dataVersionRef.current++
    }
  }

  private startRafLoop(): void {
    let lastScrollTop = this.scrollTopRef.current ?? 0

    const update = () => {
      // Only update if we have layout, cache, and valid dimensions
      if (!this.layout || !this.cache || this.dimensions.height === 0) {
        // Continue the loop even if not ready
        this.rafId = requestAnimationFrame(update)
        return
      }

      // Read current scroll position
      const currentScrollTop = this.scrollTopRef.current ?? 0
      const scrollChanged = currentScrollTop !== lastScrollTop
      lastScrollTop = currentScrollTop

      // Calculate new visible range
      const newVisibleRange = this.calculateVisibleByteRange()

      // Check if visible range changed
      const rangeChanged =
        newVisibleRange.start !== this.visibleByteRangeRef.current.start ||
        newVisibleRange.end !== this.visibleByteRangeRef.current.end

      // Update if range changed or scroll position changed (to ensure we're in sync)
      if (rangeChanged || scrollChanged) {
        this.visibleByteRangeRef.current = newVisibleRange
        // Load chunks asynchronously (doesn't block)
        this.loadChunksForRange(newVisibleRange).then(() => {
          // Update loaded bytes after chunks are loaded
          this.updateLoadedBytes()
        })
        // Update loaded bytes immediately with what we have
        this.updateLoadedBytes()
      }

      // Continue the loop
      this.rafId = requestAnimationFrame(update)
    }

    this.rafId = requestAnimationFrame(update)
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    this.cache = null
    this.file = null
    this.layout = null
    this.visibleByteRangeRef.current = { start: 0, end: 0 }
    this.loadedBytesRef.current = new Uint8Array(0)
    this.lastLoadedRange = null
  }
}
