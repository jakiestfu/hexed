import { useEffect, useMemo, useState } from "react"

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
 * @param containerRef - Reference to the scrollable container element
 * @param dataStartOffset - Optional offset where the data starts in the original file (for preserving offsets)
 * @returns Layout metrics, formatted rows, row count, total height, and visible bytes
 */
export function useCalculateEditorLayout(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLElement | null>,
  dimensions: { width: number; height: number },
  showAscii: boolean,
  data: Uint8Array,
  totalSize: number | undefined,
  dataStartOffset?: number
): {
  layout: LayoutMetrics | null
  rows: FormattedRow[]
  rowsLength: number
  totalHeight: number
  visibleBytes: number
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
    return formatDataIntoRows(
      data,
      layout.bytesPerRow,
      dataStartOffset,
      totalSize
    )
  }, [data, layout, dataStartOffset, totalSize])

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

  // Track scroll position for visibleBytes calculation
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    // Initialize scrollTop
    setScrollTop(container.scrollTop)

    return () => {
      container.removeEventListener("scroll", handleScroll)
    }
  }, [containerRef])

  // Calculate visible bytes based on scroll position
  const visibleBytes = useMemo(() => {
    if (!layout || !containerRef.current) return 0
    const visibleRows = Math.round(dimensions.height / layout.rowHeight)
    return visibleRows * layout.bytesPerRow
  }, [layout, scrollTop, dimensions.height, rowsLength, containerRef])

  return {
    layout,
    rows,
    rowsLength,
    totalHeight,
    visibleBytes
  }
}
