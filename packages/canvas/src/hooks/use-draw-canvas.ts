import { RefObject, useEffect, useRef } from "react"

import type { FormattedRow } from "@hexed/binary-utils/formatter"
import { formatDataIntoRows } from "@hexed/binary-utils/formatter"
import type { DiffResult } from "@hexed/types"

import type { HexCanvasColors } from "../hex-canvas"
import { drawHexCanvas, SelectionRange } from "../utils/canvas"
import type { LayoutMetrics } from "../utils/coordinates"
import type { FileScrollManager } from "../utils/file-scroll-manager"

/**
 * Hook for drawing the hex canvas using requestAnimationFrame
 * Continuously schedules canvas updates to read latest scrollTop from ref
 */
export function useDrawCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  scrollTopRef: RefObject<number>,
  layout: LayoutMetrics | null,
  dimensions: { width: number; height: number },
  rows: FormattedRow[],
  showAscii: boolean,
  colors: HexCanvasColors,
  diff: DiffResult | null,
  highlightedOffset: number | null,
  selectedRange: SelectionRange,
  hoveredRow: number | null,
  hoveredOffset: number | null,
  totalSize?: number,
  windowStart?: number,
  windowEnd?: number,
  fileScrollManager?: FileScrollManager | null
): void {
  // Use refs to store latest values without causing re-renders
  const latestValuesRef = useRef({
    layout,
    dimensions,
    rows,
    showAscii,
    colors,
    diff,
    highlightedOffset,
    selectedRange,
    scrollTopRef,
    hoveredRow,
    hoveredOffset,
    totalSize,
    windowStart,
    windowEnd,
    fileScrollManager
  })

  // Update refs when dependencies change
  useEffect(() => {
    latestValuesRef.current = {
      layout,
      dimensions,
      rows,
      showAscii,
      colors,
      diff,
      highlightedOffset,
      selectedRange,
      scrollTopRef,
      hoveredRow,
      hoveredOffset,
      totalSize,
      windowStart,
      windowEnd,
      fileScrollManager
    }
    // console.log("useDrawCanvas", latestValuesRef.current)
  }, [
    layout,
    dimensions,
    rows,
    showAscii,
    colors,
    diff,
    highlightedOffset,
    selectedRange,
    scrollTopRef,
    hoveredRow,
    hoveredOffset,
    totalSize,
    windowStart,
    windowEnd,
    fileScrollManager
  ])

  // Set up continuous animation loop
  useEffect(() => {
    let frameId: number | null = null

    const draw = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      const values = latestValuesRef.current
      // console.log("draw!", { canvas, ctx, values })
      if (!canvas || !ctx || !values.layout || values.dimensions.height === 0) {
        frameId = requestAnimationFrame(draw)
        return
      }

      // Read scrollTop from ref (always gets latest value)
      const scrollTop = scrollTopRef.current ?? 0

      // If manager is provided, read data directly from it (no React rerenders)
      let rowsToRender = values.rows
      let windowStartToRender = values.windowStart
      let windowEndToRender = values.windowEnd

      if (values.fileScrollManager) {
        const visibleRange = values.fileScrollManager.getVisibleByteRange()
        const loadedBytes = values.fileScrollManager.getLoadedBytes()
        const bytesPerRow = values.layout.bytesPerRow

        // Format rows from manager's loaded bytes
        rowsToRender = formatDataIntoRows(
          loadedBytes,
          bytesPerRow,
          visibleRange.start
        )
        windowStartToRender = visibleRange.start
        windowEndToRender = visibleRange.end
      }

      drawHexCanvas(
        canvas,
        ctx,
        values.layout,
        values.dimensions,
        rowsToRender,
        scrollTop,
        values.showAscii,
        values.colors,
        values.diff,
        values.highlightedOffset,
        values.selectedRange,
        values.hoveredRow,
        values.hoveredOffset,
        values.totalSize,
        windowStartToRender,
        windowEndToRender
      )

      // Schedule next frame
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
  }, [canvasRef])
}
