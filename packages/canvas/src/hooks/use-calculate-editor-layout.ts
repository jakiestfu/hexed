import { useMemo } from "react"

import type { FormattedRow } from "@hexed/binary-utils/formatter"
import { formatDataIntoRows } from "@hexed/binary-utils/formatter"

import { calculateLayout, calculateTotalHeight } from "../utils/canvas"
import type { LayoutMetrics } from "../utils/coordinates"

/**
 * Hook for calculating editor layout metrics, formatted rows, and total height
 * @param canvasRef - Reference to the canvas element
 * @param dimensions - Container dimensions (width, height)
 * @param showAscii - Whether to show ASCII column
 * @param data - The data to format into rows
 * @param totalSize - Optional total file size (for virtual scrolling)
 * @returns Layout metrics, formatted rows, row count, and total height
 */
export function useCalculateEditorLayout(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  dimensions: { width: number; height: number },
  showAscii: boolean,
  data: Uint8Array,
  totalSize?: number
): {
  layout: LayoutMetrics | null
  rows: FormattedRow[]
  rowsLength: number
  totalHeight: number
} {
  // Calculate layout metrics based on canvas dimensions
  const layout = useMemo((): LayoutMetrics | null => {
    if (dimensions.width === 0 || dimensions.height === 0) return null

    const canvas = canvasRef.current
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !canvas) return null

    return calculateLayout(ctx, canvas, dimensions, showAscii)
  }, [canvasRef, dimensions.width, dimensions.height, showAscii])

  // Format data into rows
  const rows = useMemo(() => {
    if (!layout) return []
    return formatDataIntoRows(data, layout.bytesPerRow)
  }, [data, layout])

  // Calculate total number of rows based on totalSize or actual data
  const rowsLength = useMemo(() => {
    if (totalSize !== undefined && layout) {
      return Math.ceil(totalSize / layout.bytesPerRow)
    }
    return rows.length
  }, [totalSize, layout, rows.length])

  // Calculate total canvas height (including vertical padding)
  const totalHeight = useMemo(() => {
    return calculateTotalHeight(rowsLength, layout, dimensions.height)
  }, [rowsLength, layout, dimensions.height])

  return {
    layout,
    rows,
    rowsLength,
    totalHeight
  }
}
