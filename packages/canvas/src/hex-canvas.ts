import { formatDataIntoRows } from "@hexed/binary-utils/formatter"
import type { FormattedRow } from "@hexed/binary-utils/formatter"
import type { DiffResult } from "@hexed/types"

import {
  calculateLayout,
  calculateScrollPosition,
  calculateTotalHeight,
  didDragOccur,
  drawHexCanvas,
  isOffsetInRange,
  type SelectionRange
} from "./utils/canvas"
import { getDefaultColors, type HexCanvasColors } from "./utils/colors"
import { scrollbarWidth } from "./utils/constants"
import {
  getOffsetFromPosition as getOffsetFromPositionUtil,
  getRowFromY as getRowFromYUtil,
  type LayoutMetrics
} from "./utils/coordinates"
import { FileByteCache } from "./utils/file-byte-cache"

export type HexCanvasOptions = {
  windowSize?: number // bytes (default: 128KB)
  showAscii?: boolean
  colors?: Partial<HexCanvasColors>
  diff?: DiffResult | null
  bytesPerRow?: number // optional override
}

type ByteRange = { start: number; end: number }

/**
 * Core HexCanvas class - pure vanilla JavaScript, no React dependencies
 * Manages hex editor canvas rendering, scrolling, selection, and file reading
 */
export class HexCanvas extends EventTarget {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private file: File | null = null
  private cache: FileByteCache | null = null

  // Options
  private options: Required<HexCanvasOptions> = {
    windowSize: 128 * 1024, // 128KB default
    showAscii: true,
    colors: {},
    diff: null,
    bytesPerRow: 16
  }

  // Dimensions
  private dimensions: { width: number; height: number } = {
    width: 0,
    height: 0
  }
  private resizeObserver: ResizeObserver | null = null

  // Layout
  private layout: LayoutMetrics | null = null

  // Scroll state
  private scrollTop: number = 0
  private maxScrollTop: number = 0
  private totalHeight: number = 0

  // File reading state
  private visibleByteRange: ByteRange = { start: 0, end: 0 }
  private loadedBytes: Uint8Array = new Uint8Array(0)
  private lastLoadedRange: ByteRange | null = null
  private abortController: AbortController | null = null

  // Selection state
  private selectedOffset: number | null = null
  private selectedOffsetRange: SelectionRange = null

  // Hover state
  private hoveredRow: number | null = null
  private hoveredOffset: number | null = null

  // Drag state
  private isDragging: boolean = false
  private dragStartOffset: number | null = null
  private shouldDeselect: boolean = false

  // Scrollbar drag state
  private isScrollbarDragging: boolean = false
  private scrollbarDragStartY: number = 0
  private scrollbarDragStartScrollTop: number = 0

  // Highlight state
  private highlightedOffset: number | null = null
  private highlightTimeout: ReturnType<typeof setTimeout> | null = null

  // Focus state
  private hasFocus: boolean = false

  // Animation frame
  private rafId: number | null = null
  private fileRafId: number | null = null

  constructor(
    container: HTMLElement,
    file: File | null,
    options: HexCanvasOptions = {}
  ) {
    super()

    this.container = container
    this.options = { ...this.options, ...options }

    // Create canvas element
    this.canvas = document.createElement("canvas")
    this.canvas.className = "font-mono"
    this.canvas.tabIndex = 0
    this.canvas.style.display = "block"
    this.canvas.style.position = "sticky"
    this.canvas.style.top = "0"
    this.canvas.style.left = "0"
    this.canvas.style.zIndex = "1"
    this.canvas.style.userSelect = "none"
    this.canvas.style.outline = "none"

    const ctx = this.canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get 2d context from canvas")
    }
    this.ctx = ctx

    // Append canvas to container
    this.container.appendChild(this.canvas)

    // Set up dimensions tracking
    this.setupDimensionsTracking()

    // Set file
    this.setFile(file)

    // Set up event listeners
    this.setupEventListeners()

    // Start rendering loop
    this.startRenderLoop()

    // Start file reading loop
    this.startFileReadingLoop()
  }

  private setupDimensionsTracking(): void {
    this.resizeObserver = new ResizeObserver(() => {
      const rect = this.container.getBoundingClientRect()
      this.dimensions = {
        width: rect.width,
        height: rect.height
      }
      this.recalculateLayout()
    })

    this.resizeObserver.observe(this.container)
    // Initial dimensions
    const rect = this.container.getBoundingClientRect()
    this.dimensions = {
      width: rect.width,
      height: rect.height
    }
    this.recalculateLayout()
  }

  private recalculateLayout(): void {
    if (this.dimensions.width === 0 || this.dimensions.height === 0) {
      this.layout = null
      return
    }

    const computedStyle = window.getComputedStyle(this.canvas)
    this.ctx.font = `14px ${computedStyle.getPropertyValue("--font-mono")}`

    this.layout = calculateLayout(
      this.ctx,
      this.canvas,
      this.dimensions,
      this.options.showAscii
    )

    if (this.layout) {
      // Update total height and max scroll
      this.updateScrollBounds()
    }
  }

  private updateScrollBounds(): void {
    if (!this.layout || !this.cache) {
      this.totalHeight = 0
      this.maxScrollTop = 0
      return
    }

    const rowsLength = Math.ceil(this.cache.size / this.layout.bytesPerRow)
    this.totalHeight = calculateTotalHeight(
      rowsLength,
      this.layout,
      this.dimensions.height
    )
    this.maxScrollTop = Math.max(
      0,
      Math.floor(this.totalHeight - this.dimensions.height)
    )
    this.scrollTop = Math.min(this.scrollTop, this.maxScrollTop)
  }

  setFile(file: File | null): void {
    if (this.file === file) return

    this.file = file

    if (file) {
      this.cache = new FileByteCache(file, this.options.windowSize)
      this.lastLoadedRange = null
      this.updateScrollBounds()
      this.triggerFileUpdate()
    } else {
      this.cache = null
      this.visibleByteRange = { start: 0, end: 0 }
      this.loadedBytes = new Uint8Array(0)
      this.lastLoadedRange = null
      this.updateScrollBounds()
    }
  }

  setOptions(options: Partial<HexCanvasOptions>): void {
    const oldShowAscii = this.options.showAscii
    this.options = { ...this.options, ...options }

    if (oldShowAscii !== this.options.showAscii) {
      this.recalculateLayout()
    }

    if (options.windowSize && this.cache) {
      // Recreate cache with new window size
      if (this.file) {
        this.cache = new FileByteCache(this.file, options.windowSize)
        this.lastLoadedRange = null
        this.triggerFileUpdate()
      }
    }
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave.bind(this))

    // Keyboard events
    window.addEventListener("keydown", this.handleKeyDown.bind(this))

    // Wheel events
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this), {
      passive: true
    })

    // Focus events
    this.canvas.addEventListener("focus", () => {
      this.hasFocus = true
    })
    this.canvas.addEventListener("blur", () => {
      this.hasFocus = false
    })

    // Global mouseup for drag handling
    window.addEventListener("mouseup", this.handleGlobalMouseUp.bind(this))
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.layout || !this.canvas) return

    // Check if scrollbar was clicked first
    const scrollbarClicked = this.handleScrollbarMouseDown(event)
    if (scrollbarClicked) {
      return
    }

    const rect = this.canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const offset = this.getOffsetFromPosition(mouseX, mouseY)
    if (offset !== null) {
      // Handle shift-click to extend selection
      if (event.shiftKey) {
        if (this.selectedOffsetRange !== null) {
          const anchor = this.selectedOffsetRange.start
          this.setSelectionRange({ start: anchor, end: offset })
        } else if (this.selectedOffset !== null) {
          this.setSelectionRange({ start: this.selectedOffset, end: offset })
        } else {
          this.setSelectionRange({ start: offset, end: offset })
        }
        return
      }

      // Check if clicking an already-selected single byte to deselect it
      const shouldDeselect =
        this.selectedOffsetRange !== null &&
        this.selectedOffsetRange.start === this.selectedOffsetRange.end &&
        isOffsetInRange(offset, this.selectedOffsetRange)

      this.shouldDeselect = shouldDeselect

      this.isDragging = true
      this.dragStartOffset = offset

      // Only set selection if we're not deselecting
      if (!shouldDeselect) {
        this.setSelectionRange({ start: offset, end: offset })
      }
    }

    // Focus canvas for keyboard navigation
    this.canvas.focus()
  }

  private handleMouseMove(event: MouseEvent): void {
    // Handle scrollbar dragging first
    if (this.isScrollbarDragging) {
      this.handleScrollbarMouseMove(event)
      return
    }

    if (!this.layout || !this.canvas) {
      this.hoveredRow = null
      this.hoveredOffset = null
      return
    }

    const rect = this.canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const rowIndex = this.getRowFromY(mouseY)
    const offset = this.getOffsetFromPosition(mouseX, mouseY)

    this.hoveredRow = rowIndex
    this.hoveredOffset = offset

    // Handle drag selection
    if (this.isDragging && this.dragStartOffset !== null && offset !== null) {
      this.setSelectionRange({ start: this.dragStartOffset, end: offset })
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    this.handleScrollbarMouseUp()

    if (this.isDragging) {
      const dragOccurred = didDragOccur(
        this.dragStartOffset,
        this.selectedOffsetRange
      )

      this.isDragging = false
      this.dragStartOffset = null

      // If we didn't drag and should deselect, deselect now
      if (!dragOccurred && this.shouldDeselect) {
        this.setSelectionRange(null)
        this.shouldDeselect = false
      }
    }
  }

  private handleMouseLeave(): void {
    this.hoveredRow = null
    this.hoveredOffset = null
  }

  private handleGlobalMouseUp(): void {
    this.handleScrollbarMouseUp()

    if (this.isDragging) {
      const dragOccurred = didDragOccur(
        this.dragStartOffset,
        this.selectedOffsetRange
      )

      this.isDragging = false
      this.dragStartOffset = null

      if (!dragOccurred && this.shouldDeselect) {
        this.setSelectionRange(null)
        this.shouldDeselect = false
      }
    }
  }

  private handleWheel(event: WheelEvent): void {
    // event.preventDefault()
    this.setScrollTop(this.scrollTop + event.deltaY)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore keyboard events when user is typing in input, textarea, or contenteditable elements
    const activeElement = document.activeElement
    if (
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.getAttribute("contenteditable") === "true")
    ) {
      return
    }

    // Handle Escape key to clear selection
    if (event.key === "Escape") {
      event.preventDefault()
      this.setSelectionRange(null)
      return
    }

    // Other keys require a selection
    const keyboardSelectedOffset = this.selectedOffsetRange
      ? Math.min(this.selectedOffsetRange.start, this.selectedOffsetRange.end)
      : this.selectedOffset

    if (keyboardSelectedOffset === null) return

    if (!this.layout || !this.cache) return

    const dataLength = this.cache.size
    const bytesPerRow = this.layout.bytesPerRow
    const viewportHeight = this.dimensions.height
    const rowHeight = this.layout.rowHeight

    let newOffset: number | null = null

    const clampOffset = (offset: number): number => {
      return Math.max(0, Math.min(dataLength - 1, offset))
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault()
        newOffset = clampOffset(keyboardSelectedOffset - bytesPerRow)
        break
      case "ArrowDown":
        event.preventDefault()
        newOffset = clampOffset(keyboardSelectedOffset + bytesPerRow)
        break
      case "ArrowLeft":
        event.preventDefault()
        const currentRow = Math.floor(keyboardSelectedOffset / bytesPerRow)
        const column = keyboardSelectedOffset % bytesPerRow
        if (column === 0) {
          if (currentRow === 0) {
            const lastRowStart =
              Math.floor((dataLength - 1) / bytesPerRow) * bytesPerRow
            const lastRowLength = dataLength - lastRowStart
            newOffset = clampOffset(lastRowStart + lastRowLength - 1)
          } else {
            newOffset = clampOffset(
              (currentRow - 1) * bytesPerRow + bytesPerRow - 1
            )
          }
        } else {
          newOffset = clampOffset(keyboardSelectedOffset - 1)
        }
        break
      case "ArrowRight":
        event.preventDefault()
        const currentRowRight = Math.floor(keyboardSelectedOffset / bytesPerRow)
        const rowStart = currentRowRight * bytesPerRow
        const rowEnd = Math.min(dataLength - 1, rowStart + bytesPerRow - 1)
        if (keyboardSelectedOffset >= rowEnd) {
          if (currentRowRight >= Math.floor((dataLength - 1) / bytesPerRow)) {
            newOffset = clampOffset(0)
          } else {
            newOffset = clampOffset((currentRowRight + 1) * bytesPerRow)
          }
        } else {
          newOffset = clampOffset(keyboardSelectedOffset + 1)
        }
        break
      case "Home":
        event.preventDefault()
        newOffset = clampOffset(0)
        break
      case "End":
        event.preventDefault()
        newOffset = clampOffset(dataLength - 1)
        break
      case "PageUp":
        event.preventDefault()
        const rowsPerPageUp = Math.floor(viewportHeight / rowHeight)
        newOffset = clampOffset(
          keyboardSelectedOffset - rowsPerPageUp * bytesPerRow
        )
        break
      case "PageDown":
        event.preventDefault()
        const rowsPerPageDown = Math.floor(viewportHeight / rowHeight)
        newOffset = clampOffset(
          keyboardSelectedOffset + rowsPerPageDown * bytesPerRow
        )
        break
      default:
        return
    }

    if (newOffset !== null && newOffset !== keyboardSelectedOffset) {
      this.setSelectionRange({ start: newOffset, end: newOffset })
      this.scrollToOffset(newOffset)
    }
  }

  private getRowFromY(mouseY: number): number | null {
    if (!this.layout || !this.cache) return null
    return getRowFromYUtil(
      mouseY,
      this.scrollTop,
      this.layout,
      Math.ceil(this.cache.size / this.layout.bytesPerRow)
    )
  }

  private getOffsetFromPosition(mouseX: number, mouseY: number): number | null {
    if (!this.layout || !this.cache) return null

    const rows = this.getFormattedRows()
    return getOffsetFromPositionUtil(
      mouseX,
      mouseY,
      this.layout,
      rows,
      this.options.showAscii,
      (y: number) => this.getRowFromY(y),
      this.cache.size
    )
  }

  private getFormattedRows(): FormattedRow[] {
    if (!this.cache || this.loadedBytes.length === 0) return []

    // Use the start offset from the loaded range (includes overscan), otherwise fall back to visibleByteRange
    const rangeToUse = this.lastLoadedRange || this.visibleByteRange
    return formatDataIntoRows(
      this.loadedBytes,
      this.layout?.bytesPerRow ?? 16,
      rangeToUse.start
    )
  }

  private setScrollTop(value: number): void {
    const clamped = Math.min(this.maxScrollTop, Math.max(0, Math.floor(value)))
    if (clamped === this.scrollTop) return

    this.scrollTop = clamped
    this.dispatchEvent(
      new CustomEvent("scroll", { detail: { scrollTop: this.scrollTop } })
    )
  }

  scrollToOffset(offset: number): void {
    if (!this.layout) return

    const targetScrollTop = calculateScrollPosition(
      offset,
      this.layout,
      this.dimensions.height
    )

    this.setScrollTop(targetScrollTop)

    // Set highlighted offset
    this.highlightedOffset = offset

    // Clear existing timeout
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout)
    }

    // Auto-clear highlight after 2 seconds
    this.highlightTimeout = setTimeout(() => {
      this.highlightedOffset = null
      this.highlightTimeout = null
      this.dispatchEvent(
        new CustomEvent("offsetHighlight", { detail: { offset: null } })
      )
    }, 2000)

    this.dispatchEvent(
      new CustomEvent("offsetHighlight", { detail: { offset } })
    )
  }

  private setSelectionRange(range: SelectionRange): void {
    this.selectedOffsetRange = range
    this.selectedOffset = range ? Math.min(range.start, range.end) : null

    this.dispatchEvent(
      new CustomEvent("selectionChange", { detail: { range } })
    )

    if (range) {
      this.dispatchEvent(
        new CustomEvent("byteSelect", {
          detail: { offset: this.selectedOffset }
        })
      )
    }
  }

  // Scrollbar handling
  private calculateScrollbarMetrics(): {
    trackX: number
    trackY: number
    trackWidth: number
    trackHeight: number
    thumbX: number
    thumbY: number
    thumbWidth: number
    thumbHeight: number
  } | null {
    if (this.maxScrollTop <= 0) return null

    const trackX = this.dimensions.width - scrollbarWidth
    const trackY = 0
    const trackWidth = scrollbarWidth
    const trackHeight = this.dimensions.height

    const thumbHeight = Math.max(
      20,
      Math.floor((this.dimensions.height / this.totalHeight) * trackHeight)
    )

    const thumbY =
      (this.scrollTop / this.maxScrollTop) * (trackHeight - thumbHeight) +
      trackY

    return {
      trackX,
      trackY,
      trackWidth,
      trackHeight,
      thumbX: trackX,
      thumbY,
      thumbWidth: trackWidth,
      thumbHeight
    }
  }

  private handleScrollbarMouseDown(event: MouseEvent): boolean {
    if (!this.canvas) return false

    const rect = this.canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const metrics = this.calculateScrollbarMetrics()
    if (!metrics) return false

    // Check if clicking on thumb
    if (
      mouseX >= metrics.thumbX &&
      mouseX <= metrics.thumbX + metrics.thumbWidth &&
      mouseY >= metrics.thumbY &&
      mouseY <= metrics.thumbY + metrics.thumbHeight
    ) {
      this.isScrollbarDragging = true
      this.scrollbarDragStartY = mouseY
      this.scrollbarDragStartScrollTop = this.scrollTop
      return true
    }

    // Check if clicking on track (but not thumb)
    if (
      mouseX >= metrics.trackX &&
      mouseX <= metrics.trackX + metrics.trackWidth &&
      mouseY >= metrics.trackY &&
      mouseY <= metrics.trackY + metrics.trackHeight
    ) {
      const clickY = mouseY - metrics.trackY
      const thumbHeight = metrics.thumbHeight
      const trackHeight = metrics.trackHeight
      const availableHeight = trackHeight - thumbHeight

      const targetThumbY = clickY - thumbHeight / 2
      const clampedThumbY = Math.max(0, Math.min(availableHeight, targetThumbY))
      const scrollRatio = clampedThumbY / availableHeight
      const targetScrollTop = scrollRatio * this.maxScrollTop

      this.setScrollTop(targetScrollTop)
      return true
    }

    return false
  }

  private handleScrollbarMouseMove(event: MouseEvent): void {
    if (!this.isScrollbarDragging || !this.canvas) return

    const rect = this.canvas.getBoundingClientRect()
    const mouseY = event.clientY - rect.top

    const metrics = this.calculateScrollbarMetrics()
    if (!metrics) return

    const deltaY = mouseY - this.scrollbarDragStartY
    const trackHeight = metrics.trackHeight
    const thumbHeight = metrics.thumbHeight
    const availableHeight = trackHeight - thumbHeight

    const scrollDelta = (deltaY / availableHeight) * this.maxScrollTop
    const newScrollTop = this.scrollbarDragStartScrollTop + scrollDelta

    this.setScrollTop(newScrollTop)
  }

  private handleScrollbarMouseUp(): void {
    if (this.isScrollbarDragging) {
      this.isScrollbarDragging = false
      this.scrollbarDragStartY = 0
      this.scrollbarDragStartScrollTop = 0
    }
  }

  // File reading and windowing
  private startFileReadingLoop(): void {
    const update = () => {
      if (!this.layout || !this.cache || this.dimensions.height === 0) {
        this.fileRafId = requestAnimationFrame(update)
        return
      }

      const newVisibleRange = this.calculateVisibleByteRange()

      const rangeChanged =
        newVisibleRange.start !== this.visibleByteRange.start ||
        newVisibleRange.end !== this.visibleByteRange.end

      if (rangeChanged) {
        this.visibleByteRange = newVisibleRange
        this.loadChunksForRange(newVisibleRange).then(() => {
          this.updateLoadedBytes()
        })
        this.updateLoadedBytes()
      }

      this.fileRafId = requestAnimationFrame(update)
    }

    this.fileRafId = requestAnimationFrame(update)
  }

  private calculateVisibleByteRange(): ByteRange {
    if (!this.layout || !this.cache) {
      return { start: 0, end: 0 }
    }

    const scrollTopAdjusted = Math.max(
      0,
      this.scrollTop - (this.layout.verticalPadding ?? 0)
    )
    const startRow = Math.floor(scrollTopAdjusted / this.layout.rowHeight)
    const endRow = Math.ceil(
      (scrollTopAdjusted + this.dimensions.height) / this.layout.rowHeight
    )

    const startByte = startRow * this.layout.bytesPerRow
    const endByte = Math.min(endRow * this.layout.bytesPerRow, this.cache.size)

    return { start: startByte, end: endByte }
  }

  private async loadChunksForRange(range: ByteRange): Promise<void> {
    if (!this.cache || !this.layout) return

    // Add overscan (5 rows)
    const overscan = this.layout.bytesPerRow * 5
    const startByte = Math.max(0, range.start - overscan)
    const endByte = Math.min(this.cache.size, range.end + overscan)

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
      this.loadedBytes = new Uint8Array(0)
      return
    }

    // Use lastLoadedRange if available (includes overscan), otherwise fall back to visibleByteRange
    const rangeToUse = this.lastLoadedRange || this.visibleByteRange
    const { start, end } = rangeToUse
    const startRow = Math.floor(start / this.layout.bytesPerRow)
    const endRow = Math.ceil(end / this.layout.bytesPerRow)

    const bytes: number[] = []
    for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
      const rowBytes = this.cache.getRowBytes(rowIndex, this.layout.bytesPerRow)
      bytes.push(...Array.from(rowBytes))
    }

    this.loadedBytes = new Uint8Array(bytes)
  }

  private triggerFileUpdate(): void {
    // Force recalculation on next frame
    if (this.fileRafId !== null) {
      cancelAnimationFrame(this.fileRafId)
    }
    this.startFileReadingLoop()
  }

  // Rendering
  private startRenderLoop(): void {
    const draw = () => {
      if (
        !this.canvas ||
        !this.ctx ||
        !this.layout ||
        this.dimensions.height === 0
      ) {
        this.rafId = requestAnimationFrame(draw)
        return
      }

      const rows = this.getFormattedRows()
      const colors = this.getColors()

      drawHexCanvas(
        this.canvas,
        this.ctx,
        this.layout,
        this.dimensions,
        rows,
        this.scrollTop,
        this.options.showAscii,
        colors,
        this.options.diff,
        this.highlightedOffset,
        this.selectedOffsetRange,
        this.hoveredRow,
        this.hoveredOffset,
        this.cache?.size,
        this.visibleByteRange.start,
        this.visibleByteRange.end
      )

      this.rafId = requestAnimationFrame(draw)
    }

    this.rafId = requestAnimationFrame(draw)
  }

  private getColors(): HexCanvasColors {
    const defaults = getDefaultColors(this.container)
    return {
      ...defaults,
      ...this.options.colors,
      diffAdded: { ...defaults.diffAdded, ...this.options.colors?.diffAdded },
      diffRemoved: {
        ...defaults.diffRemoved,
        ...this.options.colors?.diffRemoved
      },
      diffModified: {
        ...defaults.diffModified,
        ...this.options.colors?.diffModified
      },
      highlight: { ...defaults.highlight, ...this.options.colors?.highlight },
      byteHover: { ...defaults.byteHover, ...this.options.colors?.byteHover },
      selection: { ...defaults.selection, ...this.options.colors?.selection }
    }
  }

  // Public API
  getSelectedRange(): SelectionRange {
    return this.selectedOffsetRange
  }

  setSelectedRange(range: SelectionRange): void {
    this.setSelectionRange(range)
  }

  getScrollTop(): number {
    return this.scrollTop
  }

  destroy(): void {
    // Cancel animation frames
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    if (this.fileRafId !== null) {
      cancelAnimationFrame(this.fileRafId)
      this.fileRafId = null
    }

    // Abort file loading
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    // Clear timeout
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout)
      this.highlightTimeout = null
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    // Remove event listeners
    window.removeEventListener("keydown", this.handleKeyDown.bind(this))
    window.removeEventListener("mouseup", this.handleGlobalMouseUp.bind(this))

    // Remove canvas from DOM
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }

    // Clear state
    this.cache = null
    this.file = null
  }
}
