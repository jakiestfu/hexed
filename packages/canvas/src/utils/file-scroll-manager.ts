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
  private pendingScrollTop: number | null = null
  private isLoadingChunks: boolean = false

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
      this.pendingScrollTop = null
      this.isLoadingChunks = false
      // Trigger update to load initial chunks
      this.triggerUpdate()
    } else {
      this.cache = null
      this.visibleByteRangeRef.current = { start: 0, end: 0 }
      this.loadedBytesRef.current = new Uint8Array(0)
      this.lastLoadedRange = null
      this.pendingScrollTop = null
      this.isLoadingChunks = false
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
      // Only load chunks if we have a valid range
      if (newVisibleRange.end > newVisibleRange.start) {
        // Load chunks asynchronously and only update visible range when loaded
        this.loadChunksForRange(newVisibleRange).then((loaded) => {
          if (loaded) {
            this.visibleByteRangeRef.current = newVisibleRange
            this.updateLoadedBytes()
          } else if (this.loadedBytesRef.current.length === 0) {
            // If loading failed but we have no data, update with what we have
            this.visibleByteRangeRef.current = newVisibleRange
            this.updateLoadedBytes()
          }
        })
      }
      // Update loaded bytes immediately with what we have (if any)
      if (this.lastLoadedRange) {
        this.updateLoadedBytes()
      }
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

    // Set pending scroll position
    this.pendingScrollTop = clampedScrollTop

    // Check if chunks are already loaded for this scroll position
    if (this.cache && this.layout) {
      const requiredRange = this.calculateRequiredByteRange(clampedScrollTop)
      if (this.cache.isRangeLoaded(requiredRange)) {
        // Chunks already loaded, commit scroll position immediately
        if (this.scrollTopRef.current !== undefined) {
          this.scrollTopRef.current = clampedScrollTop
        }
        this.pendingScrollTop = null
      }
      // Otherwise, will be handled by RAF loop
    } else {
      // No cache or layout yet, commit immediately
      if (this.scrollTopRef.current !== undefined) {
        this.scrollTopRef.current = clampedScrollTop
      }
      this.pendingScrollTop = null
    }
  }

  private calculateVisibleByteRange(): ByteRange {
    if (!this.layout || !this.cache) {
      return { start: 0, end: 0 }
    }

    // Use committed scroll position (not pending) for visible range calculation
    // The visible range should reflect what's actually being rendered
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

  private calculateRequiredByteRange(scrollTop: number): ByteRange {
    if (!this.layout || !this.cache) {
      return { start: 0, end: 0 }
    }

    const scrollTopAdjusted = Math.max(
      0,
      scrollTop - (this.layout.verticalPadding ?? 0)
    )
    const startRow = Math.floor(scrollTopAdjusted / this.layout.rowHeight)
    const endRow = Math.ceil(
      (scrollTopAdjusted + this.dimensions.height) / this.layout.rowHeight
    )

    // Add overscan for the required range
    const overscan = this.bytesPerRow * 5
    const startByte = Math.max(0, startRow * this.bytesPerRow - overscan)
    const endByte = Math.min(
      this.cache.size,
      endRow * this.bytesPerRow + overscan
    )

    return { start: startByte, end: endByte }
  }

  private async loadChunksForRange(range: ByteRange): Promise<boolean> {
    if (!this.cache || !this.layout) return false

    // Add overscan (5 rows)
    const overscan = this.bytesPerRow * 5
    const startByte = Math.max(0, range.start - overscan)
    const endByte = Math.min(this.cache.size, range.end + overscan)

    // Check if range is already loaded
    if (this.cache.isRangeLoaded({ start: startByte, end: endByte })) {
      // Update lastLoadedRange to reflect current state
      this.lastLoadedRange = { start: startByte, end: endByte }
      return true
    }

    // Use sliding window: only reload if the new range extends beyond current loaded range
    // This prevents unnecessary reloads while allowing the window to slide
    const needsLoad =
      !this.lastLoadedRange ||
      startByte < this.lastLoadedRange.start ||
      endByte > this.lastLoadedRange.end

    if (!needsLoad) {
      return true
    }

    // Cancel previous load if still in progress
    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()
    this.isLoadingChunks = true

    try {
      await this.cache.ensureRange(
        { start: startByte, end: endByte },
        { signal: this.abortController.signal }
      )
      // Use sliding window: set to current range, not union
      // This prevents unbounded growth and allows chunks to be evicted
      this.lastLoadedRange = { start: startByte, end: endByte }
      this.isLoadingChunks = false
      return true
    } catch (err) {
      this.isLoadingChunks = false
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

  private updateLoadedBytes(): void {
    if (!this.cache || !this.layout) {
      this.loadedBytesRef.current = new Uint8Array(0)
      this.dataVersionRef.current++
      return
    }

    // Always use lastLoadedRange if available (includes overscan), otherwise fall back to visibleByteRange
    // This ensures consistency and prevents missing bytes
    const rangeToUse = this.lastLoadedRange || this.visibleByteRangeRef.current
    const { start, end } = rangeToUse
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

    const update = async () => {
      // Only update if we have layout, cache, and valid dimensions
      if (!this.layout || !this.cache || this.dimensions.height === 0) {
        // Continue the loop even if not ready
        this.rafId = requestAnimationFrame(update)
        return
      }

      // Check for pending scroll position first
      if (this.pendingScrollTop !== null) {
        const requiredRange = this.calculateRequiredByteRange(
          this.pendingScrollTop
        )
        const loaded = await this.loadChunksForRange(requiredRange)

        if (loaded) {
          // Chunks are loaded, commit the scroll position
          if (this.scrollTopRef.current !== undefined) {
            this.scrollTopRef.current = this.pendingScrollTop
          }
          this.pendingScrollTop = null
        }
      }

      // Read current scroll position (committed, not pending)
      const currentScrollTop = this.scrollTopRef.current ?? 0
      const scrollChanged = currentScrollTop !== lastScrollTop
      lastScrollTop = currentScrollTop

      // Calculate new visible range based on effective scroll position
      const newVisibleRange = this.calculateVisibleByteRange()

      // Check if visible range changed
      const rangeChanged =
        newVisibleRange.start !== this.visibleByteRangeRef.current.start ||
        newVisibleRange.end !== this.visibleByteRangeRef.current.end

      // Update if range changed or scroll position changed (to ensure we're in sync)
      if (rangeChanged || scrollChanged) {
        // Load chunks for the visible range
        const loaded = await this.loadChunksForRange(newVisibleRange)

        // Only update visible range if chunks are loaded
        if (loaded) {
          this.visibleByteRangeRef.current = newVisibleRange
          this.updateLoadedBytes()
        } else if (
          !this.lastLoadedRange ||
          this.loadedBytesRef.current.length === 0
        ) {
          // If loading failed but we have no data, update with what we have
          this.visibleByteRangeRef.current = newVisibleRange
          this.updateLoadedBytes()
        }
        // Otherwise, keep the previous visible range until chunks load
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
