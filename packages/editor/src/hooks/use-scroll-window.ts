import { useMemo } from "react"

import type { LayoutMetrics } from "@hexed/canvas"

import { useScrollTop } from "./use-scroll-top"

type UseScrollWindowParams = {
  containerRef: React.RefObject<HTMLElement | null>
  windowSize: number
  layout: LayoutMetrics | null
  visibleRows: number
  totalSize?: number
}

type UseScrollWindowReturn = {
  windowStart: number
  windowEnd: number
}

/**
 * Hook that calculates file read window ranges based on scroll position.
 * The window moves in discrete steps based on visibleRowsHeight threshold.
 *
 * @param containerRef - Ref to scrollable container element
 * @param windowSize - Number of bytes in the window (e.g., 1024)
 * @param layout - Layout metrics containing rowHeight and bytesPerRow
 * @param visibleRows - Number of visible rows
 * @param totalSize - Total file size (optional, for bounds checking)
 * @returns Window start and end byte offsets
 */
export function useScrollWindow({
  containerRef,
  windowSize,
  layout,
  visibleRows,
  totalSize
}: UseScrollWindowParams): UseScrollWindowReturn {
  const scrollTop = useScrollTop(containerRef.current)

  return useMemo(() => {
    if (!layout) {
      return {
        windowStart: 0,
        windowEnd: windowSize
      }
    }

    // Calculate the height of visible rows in pixels
    const visibleRowsHeight = layout.rowHeight * visibleRows

    // Calculate which window bucket we're in based on scroll threshold
    const windowIndex = Math.floor(scrollTop / visibleRowsHeight)

    // Calculate window start aligned to window-size boundaries
    const windowStart = windowIndex * windowSize

    // Clamp to file bounds
    let clampedWindowStart = Math.max(0, windowStart)
    if (totalSize !== undefined) {
      const maxStart = Math.max(0, totalSize - windowSize)
      clampedWindowStart = Math.min(clampedWindowStart, maxStart)
    }

    const windowEnd =
      totalSize !== undefined
        ? Math.min(clampedWindowStart + windowSize, totalSize)
        : clampedWindowStart + windowSize

    return {
      windowStart: clampedWindowStart,
      windowEnd
    }
  }, [scrollTop, layout, visibleRows, windowSize, totalSize])
}
