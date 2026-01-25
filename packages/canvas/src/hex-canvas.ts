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
import {
  getPointerEventData,
  getDistance,
  type PointerEventData
} from "./utils/pointer-events"

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
  private pendingScrollTop: number | null = null
  private isLoadingChunks: boolean = false

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

  // Touch state
  private touchStartPosition: { x: number; y: number; time: number } | null = null
  private touchStartOffset: number | null = null
  private isTouchDragging: boolean = false
  private touchDragThreshold: number = 5 // pixels to move before considering it a drag
  private touchScrollStartY: number = 0
  private touchScrollStartScrollTop: number = 0
  private isTouchScrolling: boolean = false

  // Inertial scrolling state
  private touchVelocityHistory: Array<{ scrollTop: number; time: number }> = []
  private inertialScrollVelocity: number = 0
  private inertialScrollRafId: number | null = null
  private isInertialScrolling: boolean = false

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

    // Store old bytesPerRow to detect changes
    const oldBytesPerRow = this.layout?.bytesPerRow

    this.layout = calculateLayout(
      this.ctx,
      this.canvas,
      this.dimensions,
      this.options.showAscii
    )

    if (this.layout) {
      // If bytesPerRow changed, clear the row cache and force reload
      if (oldBytesPerRow !== undefined && oldBytesPerRow !== this.layout.bytesPerRow) {
        if (this.cache) {
          this.cache.clearRowCache()
        }
        // Clear loaded bytes to force recalculation
        this.loadedBytes = new Uint8Array(0)
        this.lastLoadedRange = null
        // Trigger file update to reload with new bytesPerRow
        this.triggerFileUpdate()
      }

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
    // totalHeight is now the content height (all rows + padding)
    this.totalHeight = calculateTotalHeight(
      rowsLength,
      this.layout,
      this.dimensions.height
    )
    // maxScrollTop is the scrollable distance (content height - viewport height)
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
      this.pendingScrollTop = null
      this.isLoadingChunks = false
      this.updateScrollBounds()
      this.triggerFileUpdate()
    } else {
      this.cache = null
      this.visibleByteRange = { start: 0, end: 0 }
      this.loadedBytes = new Uint8Array(0)
      this.lastLoadedRange = null
      this.pendingScrollTop = null
      this.isLoadingChunks = false
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
    // Mouse events (keep for backward compatibility)
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave.bind(this))

    // Touch events
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: false
    })
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false
    })
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false
    })
    this.canvas.addEventListener(
      "touchcancel",
      this.handleTouchCancel.bind(this),
      { passive: false }
    )

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

    // Global touch events for drag handling
    window.addEventListener("touchend", this.handleGlobalTouchEnd.bind(this), {
      passive: false
    })
    window.addEventListener(
      "touchcancel",
      this.handleGlobalTouchCancel.bind(this),
      { passive: false }
    )
  }

  private handlePointerDown(pointerData: PointerEventData): void {
    if (!this.layout || !this.canvas) return

    // Check if scrollbar was clicked first
    const scrollbarClicked = this.handleScrollbarPointerDown(pointerData)
    if (scrollbarClicked) {
      return
    }

    const offset = this.getOffsetFromPosition(pointerData.x, pointerData.y)
    if (offset !== null) {
      // Handle shift-click to extend selection
      if (pointerData.shiftKey) {
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

      if (pointerData.type === "touch") {
        this.isTouchDragging = true
        this.touchStartPosition = {
          x: pointerData.x,
          y: pointerData.y,
          time: Date.now()
        }
        this.touchStartOffset = offset
      } else {
        this.isDragging = true
        this.dragStartOffset = offset
      }

      // Only set selection if we're not deselecting
      if (!shouldDeselect) {
        this.setSelectionRange({ start: offset, end: offset })
      }
    }

    // Focus canvas for keyboard navigation
    this.canvas.focus()
  }

  private handleMouseDown(event: MouseEvent): void {
    const pointerData = getPointerEventData(event, this.canvas)
    if (pointerData) {
      this.handlePointerDown(pointerData)
    }
  }

  private handlePointerMove(pointerData: PointerEventData): void {
    // Handle scrollbar dragging first
    if (this.isScrollbarDragging) {
      this.handleScrollbarPointerMove(pointerData)
      return
    }

    if (!this.layout || !this.canvas) {
      this.hoveredRow = null
      this.hoveredOffset = null
      return
    }

    const rowIndex = this.getRowFromY(pointerData.y)
    const offset = this.getOffsetFromPosition(pointerData.x, pointerData.y)

    // Only update hover for mouse events (not touch)
    if (pointerData.type === "mouse") {
      this.hoveredRow = rowIndex
      this.hoveredOffset = offset
    }

    // Handle drag selection
    if (this.isDragging && this.dragStartOffset !== null && offset !== null) {
      this.setSelectionRange({ start: this.dragStartOffset, end: offset })
    } else if (
      this.isTouchDragging &&
      this.touchStartOffset !== null &&
      offset !== null
    ) {
      this.setSelectionRange({ start: this.touchStartOffset, end: offset })
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const pointerData = getPointerEventData(event, this.canvas)
    if (pointerData) {
      this.handlePointerMove(pointerData)
    }
  }

  private handlePointerUp(pointerData: PointerEventData | null): void {
    this.handleScrollbarPointerUp()

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
    } else if (this.isTouchDragging) {
      // Touch drag handling is done in handleTouchEnd for tap detection
      this.isTouchDragging = false
      this.touchStartPosition = null
      this.touchStartOffset = null
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const pointerData = getPointerEventData(event, this.canvas)
    this.handlePointerUp(pointerData)
  }

  private handleMouseLeave(): void {
    this.hoveredRow = null
    this.hoveredOffset = null
  }

  private handleGlobalMouseUp(): void {
    this.handleScrollbarPointerUp()

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

  // Touch event handlers
  private handleTouchStart(event: TouchEvent): void {
    if (!this.layout || !this.canvas) return

    const pointerData = getPointerEventData(event, this.canvas)
    if (!pointerData) return

    // Cancel any active inertial scrolling
    this.stopInertialScroll()

    // Check if scrollbar was touched first
    const scrollbarTouched = this.handleScrollbarPointerDown(pointerData)
    if (scrollbarTouched) {
      return
    }

    // Store touch start position for tap detection and scrolling
    this.touchStartPosition = {
      x: pointerData.x,
      y: pointerData.y,
      time: Date.now()
    }
    this.touchScrollStartY = pointerData.y
    this.touchScrollStartScrollTop = this.scrollTop
    this.isTouchScrolling = false
    this.touchVelocityHistory = [] // Clear velocity history on new touch

    // Try to select byte at touch position
    const offset = this.getOffsetFromPosition(pointerData.x, pointerData.y)
    if (offset !== null) {
      this.touchStartOffset = offset
      this.isTouchDragging = true
      this.setSelectionRange({ start: offset, end: offset })
    }

    // Prevent default to avoid double-tap zoom and other default behaviors
    event.preventDefault()
  }

  private handleTouchMove(event: TouchEvent): void {
    const pointerData = getPointerEventData(event, this.canvas)
    if (!pointerData || !this.touchStartPosition) return

    // Handle scrollbar dragging first
    if (this.isScrollbarDragging) {
      this.handleScrollbarPointerMove(pointerData)
      return
    }

    const deltaY = pointerData.y - this.touchScrollStartY
    const deltaX = pointerData.x - this.touchStartPosition.x
    const distance = getDistance(
      this.touchStartPosition.x,
      this.touchStartPosition.y,
      pointerData.x,
      pointerData.y
    )

    // If we're already scrolling, continue scrolling
    if (this.isTouchScrolling) {
      const scrollDelta = deltaY
      const newScrollTop = this.touchScrollStartScrollTop - scrollDelta
      this.setScrollTop(newScrollTop)

      // Track scroll velocity for inertial scrolling (track scrollTop changes, not finger position)
      const now = Date.now()
      this.touchVelocityHistory.push({ scrollTop: this.scrollTop, time: now })
      // Keep only last 10 samples to limit memory
      if (this.touchVelocityHistory.length > 10) {
        this.touchVelocityHistory.shift()
      }

      // Update touch start position for smooth scrolling
      this.touchScrollStartY = pointerData.y
      this.touchScrollStartScrollTop = this.scrollTop

      event.preventDefault()
      return
    }

    // Determine if this is a scroll gesture or selection drag
    // If vertical movement is greater than horizontal, treat as scroll
    const isVerticalScroll = Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5

    if (isVerticalScroll) {
      // Touch scrolling
      this.isTouchScrolling = true
      this.isTouchDragging = false

      const scrollDelta = deltaY
      const newScrollTop = this.touchScrollStartScrollTop - scrollDelta
      this.setScrollTop(newScrollTop)

      // Track scroll velocity for inertial scrolling (track scrollTop changes, not finger position)
      const now = Date.now()
      this.touchVelocityHistory.push({ scrollTop: this.scrollTop, time: now })
      // Keep only last 10 samples to limit memory
      if (this.touchVelocityHistory.length > 10) {
        this.touchVelocityHistory.shift()
      }

      // Update touch start position for smooth scrolling
      this.touchScrollStartY = pointerData.y
      this.touchScrollStartScrollTop = this.scrollTop

      event.preventDefault()
    } else if (distance > this.touchDragThreshold) {
      // Selection drag
      this.isTouchDragging = true
      this.isTouchScrolling = false

      const offset = this.getOffsetFromPosition(pointerData.x, pointerData.y)
      if (offset !== null && this.touchStartOffset !== null) {
        this.setSelectionRange({ start: this.touchStartOffset, end: offset })
      }

      event.preventDefault()
    } else {
      // Small movement, might still be a tap - don't prevent default yet
      // but track the movement
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const pointerData = getPointerEventData(event, this.canvas)

    // Handle scrollbar end
    if (this.isScrollbarDragging) {
      this.handleScrollbarPointerUp()
      if (pointerData) {
        pointerData.preventDefault()
      }
      // Clean up touch state
      this.isTouchDragging = false
      this.isTouchScrolling = false
      this.touchStartPosition = null
      this.touchStartOffset = null
      this.touchScrollStartY = 0
      this.touchScrollStartScrollTop = 0
      return
    }

    // Tap detection for byte selection
    if (
      this.touchStartPosition &&
      pointerData &&
      !this.isTouchScrolling &&
      this.touchStartOffset !== null
    ) {
      const distance = getDistance(
        this.touchStartPosition.x,
        this.touchStartPosition.y,
        pointerData.x,
        pointerData.y
      )
      const duration = Date.now() - this.touchStartPosition.time

      // Consider it a tap if movement was minimal and duration was short
      const isTap = distance < this.touchDragThreshold && duration < 300

      if (isTap && !this.isTouchDragging) {
        // It's a tap - ensure selection is set
        const offset = this.getOffsetFromPosition(pointerData.x, pointerData.y)
        if (offset !== null) {
          // Check if tapping an already-selected single byte to deselect it
          const shouldDeselect =
            this.selectedOffsetRange !== null &&
            this.selectedOffsetRange.start === this.selectedOffsetRange.end &&
            isOffsetInRange(offset, this.selectedOffsetRange)

          if (shouldDeselect) {
            this.setSelectionRange(null)
          } else {
            this.setSelectionRange({ start: offset, end: offset })
          }
        }
        pointerData.preventDefault()
      } else if (this.isTouchDragging) {
        // It was a drag - selection is already set, just clean up
        const dragOccurred = didDragOccur(
          this.touchStartOffset,
          this.selectedOffsetRange
        )

        if (!dragOccurred && this.shouldDeselect) {
          this.setSelectionRange(null)
          this.shouldDeselect = false
        }
        pointerData.preventDefault()
      }
    }

    // Calculate velocity and start inertial scrolling if applicable
    if (this.isTouchScrolling && this.touchVelocityHistory.length >= 2) {
      // Calculate velocity from recent samples (use last 3-5 samples for better accuracy)
      const samples = this.touchVelocityHistory.slice(-5)
      if (samples.length >= 2) {
        // Calculate weighted average velocity (more recent samples have higher weight)
        let totalVelocity = 0
        let totalWeight = 0

        for (let i = 1; i < samples.length; i++) {
          const deltaScrollTop = samples[i].scrollTop - samples[i - 1].scrollTop
          const deltaTime = samples[i].time - samples[i - 1].time

          if (deltaTime > 0) {
            const velocity = deltaScrollTop / deltaTime // scrollTop change per millisecond
            const weight = i // More recent = higher weight
            totalVelocity += velocity * weight
            totalWeight += weight
          }
        }

        if (totalWeight > 0) {
          const averageVelocity = totalVelocity / totalWeight
          // Start inertial scroll if velocity exceeds threshold (0.5 pixels/ms)
          // Velocity is the rate of change of scrollTop, so use it directly
          if (Math.abs(averageVelocity) > 0.5) {
            this.startInertialScroll(averageVelocity)
          }
        }
      }
    }

    // Clean up touch state
    this.isTouchDragging = false
    this.isTouchScrolling = false
    this.touchStartPosition = null
    this.touchStartOffset = null
    this.touchScrollStartY = 0
    this.touchScrollStartScrollTop = 0
    this.touchVelocityHistory = []
  }

  private handleTouchCancel(event: TouchEvent): void {
    // Cancel any ongoing touch interactions
    this.handleScrollbarPointerUp()
    this.stopInertialScroll()
    this.isTouchDragging = false
    this.isTouchScrolling = false
    this.touchStartPosition = null
    this.touchStartOffset = null
    this.touchScrollStartY = 0
    this.touchScrollStartScrollTop = 0
    this.touchVelocityHistory = []
  }

  private handleGlobalTouchEnd(event: TouchEvent): void {
    this.handleTouchEnd(event)
  }

  private handleGlobalTouchCancel(event: TouchEvent): void {
    this.handleTouchCancel(event)
  }

  private startInertialScroll(initialVelocity: number): void {
    // Cancel any existing inertial scroll
    if (this.inertialScrollRafId !== null) {
      cancelAnimationFrame(this.inertialScrollRafId)
      this.inertialScrollRafId = null
    }

    // Don't start if velocity is too low
    const minVelocity = 0.1 // pixels per millisecond
    if (Math.abs(initialVelocity) < minVelocity) {
      return
    }

    this.isInertialScrolling = true
    this.inertialScrollVelocity = initialVelocity

    // Deceleration factor (0.95 per frame at ~60fps)
    const decelerationFactor = 0.95
    const minVelocityThreshold = 0.1 // pixels per millisecond

    let lastTime = performance.now()

    const animate = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Apply deceleration
      this.inertialScrollVelocity *= Math.pow(decelerationFactor, deltaTime / 16.67) // Normalize to 60fps

      // Update scroll position
      // Velocity is the rate of change of scrollTop (scrollTop per millisecond)
      // So we add it directly: newScrollTop = scrollTop + (velocity * deltaTime)
      const scrollDelta = this.inertialScrollVelocity * deltaTime
      const newScrollTop = this.scrollTop + scrollDelta
      this.setScrollTop(newScrollTop)

      // Check if we've hit boundaries
      // Positive velocity increases scrollTop (scrolling down), negative velocity decreases scrollTop (scrolling up)
      const hitTop = this.scrollTop === 0 && this.inertialScrollVelocity < 0
      const hitBottom =
        this.scrollTop >= this.maxScrollTop && this.inertialScrollVelocity > 0

      // Stop if velocity is too low or we hit boundaries
      if (
        Math.abs(this.inertialScrollVelocity) < minVelocityThreshold ||
        hitTop ||
        hitBottom
      ) {
        this.isInertialScrolling = false
        this.inertialScrollVelocity = 0
        this.inertialScrollRafId = null
        return
      }

      // Continue animation
      this.inertialScrollRafId = requestAnimationFrame(animate)
    }

    this.inertialScrollRafId = requestAnimationFrame(animate)
  }

  private stopInertialScroll(): void {
    if (this.inertialScrollRafId !== null) {
      cancelAnimationFrame(this.inertialScrollRafId)
      this.inertialScrollRafId = null
    }
    this.isInertialScrolling = false
    this.inertialScrollVelocity = 0
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
    if (clamped === this.scrollTop && this.pendingScrollTop === null) return

    // Set pending scroll position immediately for UI responsiveness
    this.pendingScrollTop = clamped

    // Check if chunks are already loaded for this scroll position
    if (this.layout && this.cache) {
      const requiredRange = this.calculateRequiredByteRange(clamped)
      if (this.cache.isRangeLoaded(requiredRange)) {
        // Chunks already loaded, update scroll position immediately
        this.commitScrollPosition(clamped)
      } else {
        // Chunks not loaded, will be handled by file reading loop
        // The scroll position will be committed after chunks load
      }
    } else {
      // No layout or cache yet, commit immediately
      this.commitScrollPosition(clamped)
    }
  }

  private commitScrollPosition(value: number): void {
    if (value === this.scrollTop && this.pendingScrollTop === null) return

    this.scrollTop = value
    this.pendingScrollTop = null
    this.dispatchEvent(
      new CustomEvent("scroll", { detail: { scrollTop: this.scrollTop } })
    )
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
    const overscan = this.layout.bytesPerRow * 5
    const startByte = Math.max(0, startRow * this.layout.bytesPerRow - overscan)
    const endByte = Math.min(
      this.cache.size,
      endRow * this.layout.bytesPerRow + overscan
    )

    return { start: startByte, end: endByte }
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

    // totalHeight is now content height, so use it for thumb height calculation
    const thumbHeight = Math.max(
      20,
      Math.floor((this.dimensions.height / this.totalHeight) * trackHeight)
    )

    // Use pending scroll position if available for better UX during scrolling
    const scrollPositionForThumb = this.pendingScrollTop ?? this.scrollTop
    const thumbY =
      (scrollPositionForThumb / this.maxScrollTop) *
      (trackHeight - thumbHeight) +
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

  private handleScrollbarPointerDown(pointerData: PointerEventData): boolean {
    if (!this.canvas) return false

    const metrics = this.calculateScrollbarMetrics()
    if (!metrics) return false

    // Cancel any active inertial scrolling when starting scrollbar drag
    this.stopInertialScroll()

    // Check if clicking on thumb
    if (
      pointerData.x >= metrics.thumbX &&
      pointerData.x <= metrics.thumbX + metrics.thumbWidth &&
      pointerData.y >= metrics.thumbY &&
      pointerData.y <= metrics.thumbY + metrics.thumbHeight
    ) {
      this.isScrollbarDragging = true
      this.scrollbarDragStartY = pointerData.y
      this.scrollbarDragStartScrollTop = this.scrollTop
      pointerData.preventDefault()
      return true
    }

    // Check if clicking on track (but not thumb)
    if (
      pointerData.x >= metrics.trackX &&
      pointerData.x <= metrics.trackX + metrics.trackWidth &&
      pointerData.y >= metrics.trackY &&
      pointerData.y <= metrics.trackY + metrics.trackHeight
    ) {
      const clickY = pointerData.y - metrics.trackY
      const thumbHeight = metrics.thumbHeight
      const trackHeight = metrics.trackHeight
      const availableHeight = trackHeight - thumbHeight

      const targetThumbY = clickY - thumbHeight / 2
      const clampedThumbY = Math.max(0, Math.min(availableHeight, targetThumbY))
      const scrollRatio = clampedThumbY / availableHeight
      const targetScrollTop = scrollRatio * this.maxScrollTop

      this.setScrollTop(targetScrollTop)
      pointerData.preventDefault()
      return true
    }

    return false
  }

  private handleScrollbarMouseDown(event: MouseEvent): boolean {
    const pointerData = getPointerEventData(event, this.canvas)
    if (!pointerData) return false
    return this.handleScrollbarPointerDown(pointerData)
  }

  private handleScrollbarPointerMove(pointerData: PointerEventData): void {
    if (!this.isScrollbarDragging || !this.canvas) return

    const metrics = this.calculateScrollbarMetrics()
    if (!metrics) return

    const deltaY = pointerData.y - this.scrollbarDragStartY
    const trackHeight = metrics.trackHeight
    const thumbHeight = metrics.thumbHeight
    const availableHeight = trackHeight - thumbHeight

    const scrollDelta = (deltaY / availableHeight) * this.maxScrollTop
    const newScrollTop = this.scrollbarDragStartScrollTop + scrollDelta

    // Set pending scroll position during drag
    this.setScrollTop(newScrollTop)
    pointerData.preventDefault()
  }

  private handleScrollbarMouseMove(event: MouseEvent): void {
    const pointerData = getPointerEventData(event, this.canvas)
    if (pointerData) {
      this.handleScrollbarPointerMove(pointerData)
    }
  }

  private handleScrollbarPointerUp(): void {
    if (this.isScrollbarDragging) {
      this.isScrollbarDragging = false
      this.scrollbarDragStartY = 0
      this.scrollbarDragStartScrollTop = 0
      // Final scroll position will be committed when chunks load (handled by setScrollTop)
    }
  }

  private handleScrollbarMouseUp(): void {
    this.handleScrollbarPointerUp()
  }

  // File reading and windowing
  private startFileReadingLoop(): void {
    const update = async () => {
      if (!this.layout || !this.cache || this.dimensions.height === 0) {
        this.fileRafId = requestAnimationFrame(update)
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
          this.commitScrollPosition(this.pendingScrollTop)
        }
      }

      // Calculate visible range based on effective scroll position (not pending)
      const effectiveScrollTop = this.scrollTop
      const newVisibleRange =
        this.calculateVisibleByteRangeForScroll(effectiveScrollTop)

      const rangeChanged =
        newVisibleRange.start !== this.visibleByteRange.start ||
        newVisibleRange.end !== this.visibleByteRange.end

      if (rangeChanged) {
        // Load chunks for the visible range
        const loaded = await this.loadChunksForRange(newVisibleRange)

        // Only update visible range if chunks are loaded
        if (loaded) {
          this.visibleByteRange = newVisibleRange
          this.updateLoadedBytes()
        } else if (!this.lastLoadedRange || this.loadedBytes.length === 0) {
          // If loading failed but we have no data, update with what we have
          this.visibleByteRange = newVisibleRange
          this.updateLoadedBytes()
        }
        // Otherwise, keep the previous visible range until chunks load
      }

      this.fileRafId = requestAnimationFrame(update)
    }

    this.fileRafId = requestAnimationFrame(update)
  }

  private calculateVisibleByteRangeForScroll(scrollTop: number): ByteRange {
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

    const startByte = startRow * this.layout.bytesPerRow
    const endByte = Math.min(endRow * this.layout.bytesPerRow, this.cache.size)

    return { start: startByte, end: endByte }
  }

  private calculateVisibleByteRange(): ByteRange {
    // Use effective scroll position (not pending) for visible range calculation
    return this.calculateVisibleByteRangeForScroll(this.scrollTop)
  }

  private async loadChunksForRange(range: ByteRange): Promise<boolean> {
    if (!this.cache || !this.layout) return false

    // Add overscan (5 rows)
    const overscan = this.layout.bytesPerRow * 5
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
      this.loadedBytes = new Uint8Array(0)
      return
    }

    // Always use lastLoadedRange if available (includes overscan), otherwise fall back to visibleByteRange
    // This ensures consistency with getFormattedRows() which uses the same logic
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

      // Only render if we have loaded bytes for the visible range
      // Check that lastLoadedRange covers the visible range
      const canRender =
        this.lastLoadedRange &&
        this.lastLoadedRange.start <= this.visibleByteRange.start &&
        this.lastLoadedRange.end >= this.visibleByteRange.end &&
        this.loadedBytes.length > 0

      // If we can't render yet, keep rendering the previous frame
      // This prevents showing empty or incorrect data
      if (!canRender && this.loadedBytes.length === 0) {
        // No data at all, skip rendering
        this.rafId = requestAnimationFrame(draw)
        return
      }

      const rows = this.getFormattedRows()
      const colors = this.getColors()

      // Use effective scroll position (not pending) for rendering
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
        this.lastLoadedRange?.start ?? this.visibleByteRange.start,
        this.lastLoadedRange?.end ?? this.visibleByteRange.end
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

    if (this.inertialScrollRafId !== null) {
      cancelAnimationFrame(this.inertialScrollRafId)
      this.inertialScrollRafId = null
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
    window.removeEventListener("touchend", this.handleGlobalTouchEnd.bind(this))
    window.removeEventListener(
      "touchcancel",
      this.handleGlobalTouchCancel.bind(this)
    )

    // Remove canvas from DOM
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }

    // Clear state
    this.cache = null
    this.file = null
  }
}
