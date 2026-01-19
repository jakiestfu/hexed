import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

type UseRecenteredVirtualRowsParams = {
  containerRef: React.RefObject<HTMLElement | null>
  totalRows: number
  rowHeight: number
  windowRows?: number
  overscan?: number
  viewHeight: number
}

export const useRecenteredVirtualRows = ({
  containerRef,
  totalRows,
  rowHeight,
  windowRows = 50_000,
  overscan = 20,
  viewHeight,
}: UseRecenteredVirtualRowsParams) => {
  // const parentRef = useRef<HTMLDivElement | null>(null)

  // baseRow = which file-row corresponds to virtual index 0
  const [baseRow, setBaseRow] = React.useState(0)

  const maxBaseRow = Math.max(0, totalRows - windowRows)
  const clampedBaseRow = Math.max(0, Math.min(baseRow, maxBaseRow))

  const virtualizer = useVirtualizer({
    count: Math.min(windowRows, totalRows),
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  // Keep scrollTop near the middle; shift baseRow when near edges
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const totalHeight = Math.min(windowRows, totalRows) * rowHeight

    // Put the scroll position near the middle initially (if possible)
    const mid = Math.max(0, Math.floor(totalHeight / 2 - viewHeight / 2))
    if (el.scrollTop === 0 && totalHeight > viewHeight) {
      el.scrollTop = mid
    }

    const topThreshold = Math.floor(viewHeight * 0.25)
    const botThreshold = Math.floor(totalHeight - viewHeight * 1.25)

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const scrollTop = el.scrollTop

        // Shift upward
        if (scrollTop < topThreshold && clampedBaseRow > 0) {
          const deltaRows = Math.max(1, Math.floor((mid - scrollTop) / rowHeight))
          const nextBase = Math.max(0, clampedBaseRow - deltaRows)
          const applied = clampedBaseRow - nextBase
          if (applied > 0) {
            setBaseRow(nextBase)
            el.scrollTop = scrollTop + applied * rowHeight
          }
          return
        }

        // Shift downward
        if (scrollTop > botThreshold && clampedBaseRow < maxBaseRow) {
          const deltaRows = Math.max(1, Math.floor((scrollTop - mid) / rowHeight))
          const nextBase = Math.min(maxBaseRow, clampedBaseRow + deltaRows)
          const applied = nextBase - clampedBaseRow
          if (applied > 0) {
            setBaseRow(nextBase)
            el.scrollTop = scrollTop - applied * rowHeight
          }
        }
      })
    }

    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("scroll", onScroll)
    }
  }, [rowHeight, windowRows, totalRows, clampedBaseRow, maxBaseRow])

  const toFileRow = React.useCallback(
    (virtualIndex: number) => clampedBaseRow + virtualIndex,
    [clampedBaseRow]
  )

  return { virtualizer, baseRow: clampedBaseRow, toFileRow }
}