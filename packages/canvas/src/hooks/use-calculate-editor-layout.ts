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
  showAscii: boolean
) {
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

  return layout
}

export type VisibleDataLayoutMetrics = ReturnType<
  typeof useCalculateVisibleData
>
export function useCalculateVisibleData(
  layout: LayoutMetrics | null,
  dimensions: { width: number; height: number },
  // windowSize: number,
  totalSize: number | undefined
) {
  // Calculate total number of rows based on totalSize or actual data
  const rowsLength = useMemo(() => {
    if (totalSize !== undefined && layout) {
      return Math.ceil(totalSize / layout.bytesPerRow)
    }
    return 0
  }, [totalSize, layout])

  const visibleRows = useMemo(() => {
    if (!layout) return 0
    return Math.round(
      (dimensions.height - layout.verticalPadding) / layout.rowHeight
    )
  }, [dimensions.height, layout])

  // const nonEmptyRows = useMemo(() => {
  //   if (!layout) return 0
  //   const renderedRows = Math.ceil(windowSize / layout.bytesPerRow)
  //   return Math.min(visibleRows, renderedRows)
  // }, [visibleRows, layout])

  const visibleBytes = useMemo(
    () => (layout ? visibleRows * layout.bytesPerRow : 0),
    [layout, visibleRows]
  )

  // Calculate total canvas height (including vertical padding)
  const totalHeight = useMemo(() => {
    return calculateTotalHeight(rowsLength, layout, dimensions.height)
  }, [rowsLength, layout, dimensions.height])

  return {
    rowsLength,
    totalHeight,
    visibleRows,
    visibleBytes
    // nonEmptyRows
  }
}

export const useCalculateNonEmptyRows = (
  layout: LayoutMetrics | null,
  visibleRows: number,
  windowSize: number
) => {
  return useMemo(() => {
    if (!layout) return 0
    const renderedRows = Math.ceil(windowSize / layout.bytesPerRow)
    return Math.min(visibleRows, renderedRows)
  }, [visibleRows, layout])
}
