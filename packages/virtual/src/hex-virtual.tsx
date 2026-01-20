import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useVirtualFileBytes } from "./hooks/use-virtual-file-bytes"
import { useRecenteredVirtualRows } from "./hooks/use-recentered-virtual-rows"
import { cellWidth, rowHeight } from "./constants"
import { useMemo, useLayoutEffect, useState, useRef } from "react"

type HexViewerProps = {
  containerRef: React.RefObject<HTMLDivElement | null>
  file: File | null
  // height?: number
  // rowHeight?: number
  dimensions: { width: number; height: number }
}

const toHex2 = (b: number) => b.toString(16).padStart(2, "0").toUpperCase()

export function HexVirtual({ containerRef, file, dimensions }: HexViewerProps) {
  // Use state and ResizeObserver for byteRowWidth to avoid blocking render
  const [byteRowWidth, setByteRowWidth] = useState(0)
  const bytesElementRef = useRef<HTMLDivElement | null>(null)

  // Set up ResizeObserver for byteRowWidth calculation
  useLayoutEffect(() => {
    const element = bytesElementRef.current
    if (!element) return

    const updateWidth = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0) {
        setByteRowWidth(Math.floor(rect.width))
      }
    }

    // Initial measurement - use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateWidth()
    })

    // Observe resize changes
    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [dimensions])
  
  const bytesPerRow = useMemo(() => {
    if (byteRowWidth > 0) {
      return Math.floor(byteRowWidth / cellWidth)
    }
    // Fallback: estimate from container width if available
    if (dimensions.width > 0) {
      // Estimate: address (80px) + padding (32px) + gap (8px) = ~120px for address column
      const estimatedBytesWidth = dimensions.width - 120
      return Math.max(16, Math.floor(estimatedBytesWidth / cellWidth))
    }
    return 16 // Final fallback
  }, [byteRowWidth, dimensions.width])

  const { rowCount, ensureRows, getRowBytes } = useVirtualFileBytes({
    file,
    bytesPerRow,
    chunkSize: 128 * 1024, // Load chunks of 128KB at a time
  })

  const { virtualizer, toFileRow } = useRecenteredVirtualRows({
    containerRef,
    totalRows: rowCount,
    rowHeight,
    windowRows: 1000, // Every 300 rows, we reset the scroll
    overscan: 100,
    viewHeight: dimensions.height,
  })

  // Get virtual items - don't memoize as virtualizer internally manages updates
  const items = virtualizer.getVirtualItems()

  // Trigger virtualizer measurement after mount and when dimensions/byteRowWidth change
  // useLayoutEffect(() => {
  //   if (dimensions.height > 0 && dimensions.width > 0 && containerRef.current) {
  //     // Use requestAnimationFrame to ensure DOM is fully laid out
  //     requestAnimationFrame(() => {
  //       virtualizer.measure()
  //     })
  //   }
  // }, [virtualizer, dimensions.height, dimensions.width, byteRowWidth, containerRef])

  // Prefetch bytes for visible+overscan rows
  React.useEffect(() => {
    if (!file || rowCount === 0) return

    if (items.length === 0) {
      // If no items yet but we have rows, try to fetch initial visible range
      // This ensures data loads even if virtualizer hasn't measured yet
      const estimatedVisibleRows = Math.ceil(dimensions.height / rowHeight) + 50 // overscan
      const initialStart = 0
      const initialEnd = Math.min(estimatedVisibleRows - 1, rowCount - 1)
      const ac = new AbortController()
      ensureRows(initialStart, initialEnd, ac.signal).catch((err) => {
        if (err?.name !== "AbortError") console.error(err)
      })
      return () => ac.abort()
    }

    // Fetch data for visible items
    const vStart = items[0]!.index
    const vEnd = items[items.length - 1]!.index

    const fileStart = toFileRow(vStart)
    const fileEnd = toFileRow(vEnd)

    const ac = new AbortController()
    ensureRows(fileStart, fileEnd, ac.signal).catch((err) => {
      if (err?.name !== "AbortError") console.error(err)
    })
    return () => ac.abort()
  }, [file, toFileRow, ensureRows, items, rowCount, dimensions.height, rowHeight])

  // console.log("Rerender?")
  // return <div style={{height: '1000px'}}><p>wat</p></div>
  return (
    <div ref={containerRef} style={{ height: dimensions.height, overflow: "auto", fontFamily: "monospace", fontSize: 12 }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        <div className="flex w-full gap-2 px-4 sr-only opacity-0 pointer-events-none" aria-hidden>
          <span>00000000</span>
          <div ref={bytesElementRef} data-bytes className="grow" />
        </div>

        {items.map((v) => {
          const fileRow = toFileRow(v.index)
          if (fileRow >= rowCount) return null

          const bytes = getRowBytes(fileRow)
          const addr = (fileRow * bytesPerRow).toString(16).padStart(8, "0").toUpperCase()
          // console.log("bytes", bytes)
          return (
            <div
              key={v.key}
              className="absolute w-full top-0 left-0 flex items-center gap-2 px-4 whitespace-pre"
              style={{ transform: `translateY(${v.start}px)`, height: v.size }}
            >
              <span style={{ opacity: 0.7 }}>{addr}</span>

                <div className="grow flex justify-between items-center" style={{ height: `${rowHeight}px` }}>
                {Array.from({ length: bytesPerRow }, (_, i) => {
                  const b = bytes[i]
                  return (
                      <div className="text-center" style={{ width: cellWidth }}>{(b == null ? "" : b.toString(16).padStart(2, "0").toUpperCase()) }</div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}