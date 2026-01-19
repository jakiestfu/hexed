import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useVirtualFileBytes } from "./hooks/use-virtual-file-bytes"
import { useRecenteredVirtualRows } from "./hooks/use-recentered-virtual-rows"

type HexViewerProps = {
  containerRef: React.RefObject<HTMLElement | null>
  file: File | null
  height?: number
  rowHeight?: number
}

const toHex2 = (b: number) => b.toString(16).padStart(2, "0").toUpperCase()

export function HexVirtual({ containerRef, file, height = 500, rowHeight = 22 }: HexViewerProps) {
  
  const { rowCount, ensureRows, getRowBytes } = useVirtualFileBytes({
    file,
    bytesPerRow: 16,
    chunkSize: 1024,
    // chunkSize: 128 * 1024,
  })


  const { virtualizer, toFileRow } = useRecenteredVirtualRows({
    containerRef,
    totalRows: rowCount,
    rowHeight,
    windowRows: 300,
    overscan: 0,
    viewHeight: height,
  })

  // const virtualizer = useVirtualizer({
  //   count: rowCount,
  //   getScrollElement: () => containerRef.current,
  //   estimateSize: () => rowHeight,
  //   overscan: 0,
  // })

  // Prefetch bytes for visible+overscan rows
  React.useEffect(() => {
    const items = virtualizer.getVirtualItems()
    if (items.length === 0) return

    const vStart = items[0]!.index
    const vEnd = items[items.length - 1]!.index

    const fileStart = toFileRow(vStart)
    const fileEnd = toFileRow(vEnd)

    const ac = new AbortController()
    ensureRows(fileStart, fileEnd, ac.signal).catch((err) => {
      if (err?.name !== "AbortError") console.error(err)
    })
    return () => ac.abort()
  }, [virtualizer, toFileRow, ensureRows])

  return (
    <div ref={containerRef} style={{ height, overflow: "auto", fontFamily: "monospace", fontSize: 12 }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((v) => {
          const fileRow = toFileRow(v.index)
          if (fileRow >= rowCount) return null

          const bytes = getRowBytes(fileRow)
          const addr = (fileRow * 16).toString(16).padStart(8, "0").toUpperCase()

          return (
            <div
              key={v.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translateY(${v.start}px)`,
                height: v.size,
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "0 8px",
                whiteSpace: "pre",
              }}
            >
              <span style={{ opacity: 0.7 }}>{addr}</span>
              <span>
                {Array.from({ length: 16 }, (_, i) => {
                  const b = bytes[i]
                  return (b == null ? "··" : b.toString(16).padStart(2, "0").toUpperCase()) + (i === 15 ? "" : " ")
                }).join("")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}