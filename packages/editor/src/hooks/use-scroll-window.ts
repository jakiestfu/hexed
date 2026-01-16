import { RefObject, useCallback, useEffect, useRef, useState } from "react"

import { useVirtualScrollTop, type LayoutMetrics } from "@hexed/canvas"

type UseScrollWindowParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  scrollTopRef: RefObject<number>
  elementHeight: number
  totalHeight: number
  windowSize: number
  layout: LayoutMetrics | null
  visibleRows: number
  totalSize?: number
  overscanFactor?: number
  thresholdFactor?: number
}

type UseScrollWindowReturn = {
  windowStart: number
  windowEnd: number
}

/**
 * Hook that calculates file read window ranges based on scroll position.
 * Implements a rolling window with overscan that updates only when approaching boundaries.
 *
 * @param overscanFactor - Multiplier for visible rows to determine overscan (default: 2)
 * @param thresholdFactor - Fraction of visible height to use as update threshold (default: 0.3)
 */
export function useScrollWindow({
  canvasRef,
  elementHeight,
  totalHeight,
  scrollTopRef,
  windowSize: providedWindowSize,
  layout,
  visibleRows,
  totalSize,
  overscanFactor = 2,
  thresholdFactor = 0.3
}: UseScrollWindowParams): UseScrollWindowReturn {
  useVirtualScrollTop(canvasRef, scrollTopRef, elementHeight, totalHeight)

  const getRange = useCallback(() => {
    if (!layout) {
      return {
        windowStart: 0,
        windowEnd: providedWindowSize
      }
    }

    const scrollTop = scrollTopRef.current

    // Convert scrollTop (pixels) to row index
    // Account for vertical padding in the layout
    const adjustedScrollTop = Math.max(0, scrollTop - layout.verticalPadding)
    const rowIndex = Math.floor(adjustedScrollTop / layout.rowHeight)

    // Calculate visible byte range from scroll position
    const visibleStartByte = Math.max(0, rowIndex * layout.bytesPerRow)
    const visibleBytes = visibleRows * layout.bytesPerRow
    const visibleEndByte = visibleStartByte + visibleBytes

    // Calculate overscan based on visible rows
    const overscanBytes = visibleRows * layout.bytesPerRow * overscanFactor

    // Calculate window with overscan, centered around visible area
    let windowStart = Math.max(0, visibleStartByte - overscanBytes)
    let windowEnd = visibleEndByte + overscanBytes

    // Clamp to file bounds while preserving window size
    if (totalSize !== undefined) {
      const windowSize = windowEnd - windowStart
      // If window exceeds file size, align to end
      if (windowEnd > totalSize) {
        windowEnd = totalSize
        windowStart = Math.max(0, totalSize - windowSize)
      }
      // Ensure window start doesn't go negative
      windowStart = Math.max(0, windowStart)
    }

    return {
      windowStart,
      windowEnd
    }
  }, [
    scrollTopRef,
    layout,
    visibleRows,
    providedWindowSize,
    totalSize,
    overscanFactor
  ])

  const [range, setRange] = useState<{
    windowStart: number
    windowEnd: number
  }>(() => getRange())

  // Use ref to track current range for threshold checks without causing effect re-runs
  const rangeRef = useRef(range)
  useEffect(() => {
    rangeRef.current = range
  }, [range])

  useEffect(() => {
    if (!layout) {
      const initialRange = getRange()
      setRange(initialRange)
      return
    }

    let frameId: number | null = null

    const draw = () => {
      const scrollTop = scrollTopRef.current
      const currentRange = rangeRef.current
      const visibleRowsHeight = layout.rowHeight * visibleRows
      const threshold = visibleRowsHeight * thresholdFactor

      // Convert current window byte boundaries to pixel positions
      const currentStartRow = Math.floor(
        currentRange.windowStart / layout.bytesPerRow
      )
      const currentEndRow = Math.ceil(
        currentRange.windowEnd / layout.bytesPerRow
      )
      const currentWindowStartPixel =
        currentStartRow * layout.rowHeight + layout.verticalPadding
      const currentWindowEndPixel =
        currentEndRow * layout.rowHeight + layout.verticalPadding

      // Calculate visible area boundaries from current scroll position
      const adjustedScrollTop = Math.max(0, scrollTop - layout.verticalPadding)
      const visibleStartRow = Math.floor(adjustedScrollTop / layout.rowHeight)
      const visibleEndRow = visibleStartRow + visibleRows
      const visibleStartPixel =
        visibleStartRow * layout.rowHeight + layout.verticalPadding
      const visibleEndPixel =
        visibleEndRow * layout.rowHeight + layout.verticalPadding

      // Check if visible area is approaching window boundaries
      const nearStartBoundary =
        visibleStartPixel < currentWindowStartPixel + threshold
      const nearEndBoundary =
        visibleEndPixel > currentWindowEndPixel - threshold
      const shouldUpdate = nearStartBoundary || nearEndBoundary

      if (shouldUpdate) {
        const newRange = getRange()

        // Only update if the range actually changed
        if (
          currentRange.windowStart !== newRange.windowStart ||
          currentRange.windowEnd !== newRange.windowEnd
        ) {
          setRange(newRange)
        }
      }

      frameId = requestAnimationFrame(draw)
    }

    // Start the animation loop
    frameId = requestAnimationFrame(draw)

    // Cleanup: cancel pending frame
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [canvasRef, getRange, layout, visibleRows, thresholdFactor])

  return range
}
