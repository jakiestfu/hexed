import { useEffect, useMemo, useRef, useState } from "react"

import type { FormattedRow } from "@hexed/binary-utils/formatter"

import { calculateLayout, calculateTotalHeight } from "../utils/canvas"
import type { LayoutMetrics } from "../utils/coordinates"
import { useFormatData } from "./use-format-data"

/**
 * Hook for calculating editor layout metrics, formatted rows, and total height
 * @param canvasRef - Reference to the canvas element
 * @param dimensions - Container dimensions (width, height)
 * @param showAscii - Whether to show ASCII column
 * @param data - The data to format into rows
 * @param totalSize - Optional total file size (for virtual scrolling)
 * @param containerRef - Reference to the scrollable container element
 * @param dataStartOffset - Optional offset where the data starts in the original file (for preserving offsets)
 * @returns Layout metrics, formatted rows, row count, total height, and visible bytes
 */
export function useCalculateEditorLayout(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  dimensions: { width: number; height: number },
  showAscii: boolean,
  totalSize: number | undefined
): {
  layout: LayoutMetrics | null
  rowsLength: number
  totalHeight: number
  visibleBytes: number
} {
  // Track canvas availability to trigger recalculation when ref becomes available
  // const [canvasAvailable, setCanvasAvailable] = useState(false)
  // const prevCanvasAvailableRef = useRef(false)

  // Monitor canvas ref availability - update state when canvas becomes available
  // useEffect(() => {
  //   const hasCanvas = canvasRef.current !== null
  //   if (hasCanvas !== prevCanvasAvailableRef.current) {
  //     prevCanvasAvailableRef.current = hasCanvas
  //     // setCanvasAvailable(hasCanvas)
  //   }
  // })

  // Calculate layout metrics based on canvas dimensions
  const layout = useMemo((): LayoutMetrics | null => {
    if (dimensions.width === 0 || dimensions.height === 0) return null

    const canvas = canvasRef.current
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !canvas) return null

    return calculateLayout(ctx, canvas, dimensions, showAscii)
  }, [
    canvasRef,
    dimensions.width,
    dimensions.height,
    showAscii
    // canvasAvailable
  ])

  // Calculate total number of rows based on totalSize or actual data
  const rowsLength = useMemo(() => {
    if (totalSize !== undefined && layout) {
      return Math.ceil(totalSize / layout.bytesPerRow)
    }
    return 0
  }, [totalSize, layout])

  const visibleBytes = useMemo(() => {
    if (!layout) return 0
    const visibleRows = Math.round(dimensions.height / layout.rowHeight)
    return visibleRows * layout.bytesPerRow
  }, [layout, dimensions.height, rowsLength])

  // Calculate total canvas height (including vertical padding)
  const totalHeight = useMemo(() => {
    return calculateTotalHeight(rowsLength, layout, dimensions.height)
  }, [rowsLength, layout, dimensions.height])

  // // Format data into rows
  // const rows = useFormatData(
  //   data,
  //   layout?.bytesPerRow ?? null,
  //   dataStartOffset,
  //   totalSize
  // )

  return {
    layout,
    // rows,
    rowsLength,
    totalHeight,
    visibleBytes
  }
}
