import { RefObject, useCallback, useEffect, useMemo, useState } from "react"

import { useVirtualScrollTop, type LayoutMetrics } from "@hexed/canvas"

import { useRequestAnimationFrame } from "../../../canvas/src/hooks/use-request-animation-frame"
import { useScrollTop } from "./use-scroll-top"

type UseScrollWindowParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  scrollTopRef: RefObject<number>
  elementHeight: number
  totalHeight: number
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
  canvasRef,
  elementHeight,
  totalHeight,
  scrollTopRef,
  windowSize,
  layout,
  visibleRows,
  totalSize
}: UseScrollWindowParams): UseScrollWindowReturn {
  // const scrollTop = useScrollTop(canvasRef.current)
  useVirtualScrollTop(canvasRef, scrollTopRef, elementHeight, totalHeight)
  // console.log("SCROLL WINDOW STATE UPDATE")
  // console.log("SCROLL WINDOW", {
  //   scrollTop,
  //   canvasRef,
  //   elementHeight,
  //   totalHeight,
  //   layout,
  //   totalSize
  // })
  // console.log("SCROLL WINDOW", { scrollTop, layout, totalSize, containerRef })

  // useRequestAnimationFrame(() => {
  //   console.log("wat")
  // }, [])

  const getRange = useCallback(() => {
    if (!layout) {
      return {
        windowStart: 0,
        windowEnd: windowSize
      }
    }

    // Calculate the height of visible rows in pixels
    const visibleRowsHeight = layout.rowHeight * visibleRows

    // Calculate which window bucket we're in based on scroll threshold
    const windowIndex = Math.floor(scrollTopRef.current / visibleRowsHeight)

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
  }, [scrollTopRef, layout, visibleRows, windowSize, totalSize])

  const [range, setRange] = useState<{
    windowStart: number
    windowEnd: number
  }>({
    windowStart: 0,
    windowEnd: 0
  })

  useEffect(() => {
    let frameId: number | null = null

    const draw = () => {
      const currentRange = getRange()

      if (
        range.windowStart !== currentRange.windowStart ||
        range.windowEnd === 0
      ) {
        setRange(currentRange)
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
  }, [canvasRef, getRange, range])

  return range
}
