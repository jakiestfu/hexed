import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useVirtualFileBytes } from "./hooks/use-virtual-file-bytes"
import { useRecenteredVirtualRows } from "./hooks/use-recentered-virtual-rows"
import { cellWidth, rowHeight } from "./constants"
import { useMemo } from "react"

type HexViewerProps = {
  containerRef: React.RefObject<HTMLDivElement | null>
  file: File | null
  // height?: number
  // rowHeight?: number
  dimensions: { width: number; height: number }
}

const toHex2 = (b: number) => b.toString(16).padStart(2, "0").toUpperCase()

export function HexVirtual({ containerRef, file, dimensions }: HexViewerProps) {
  
  const byteRowWidth = useMemo(() => {
    if (!dimensions) return 0
    const element = containerRef.current?.querySelector("[data-bytes]")
    const rect = element?.getBoundingClientRect()
    if (!rect) console.log("no rect", containerRef.current)
    return Math.floor(rect?.width ?? 0)
  }, [dimensions, containerRef])
  
  const bytesPerRow = useMemo(() => {
    return Math.floor(byteRowWidth / cellWidth)
  }, [byteRowWidth])
  // const bytesPerRow = 16

  const { rowCount, ensureRows, getRowBytes } = useVirtualFileBytes({
    file,
    bytesPerRow,
    chunkSize: 128 * 1024, // Load chunks of 1024 bytes at a time
    // chunkSize: 128 * 1024,
  })


  const { virtualizer, toFileRow } = useRecenteredVirtualRows({
    containerRef,
    totalRows: rowCount,
    rowHeight,
    windowRows: 300, // Every 300 rows, we reset the scroll
    overscan: 50,
    viewHeight: dimensions.height,
  })

  // Prefetch bytes for visible+overscan rows
  // console.log("Rerender?")
  const items = virtualizer.getVirtualItems()
  React.useEffect(() => {
    // const items = virtualizer.getVirtualItems()
    if (items.length === 0) return
    // console.log("VIRTUAL ITEMS", items)

    const vStart = items[0]!.index
    const vEnd = items[items.length - 1]!.index

    const fileStart = toFileRow(vStart)
    const fileEnd = toFileRow(vEnd)

    const ac = new AbortController()
    ensureRows(fileStart, fileEnd, ac.signal).catch((err) => {
      if (err?.name !== "AbortError") console.error(err)
    })
    return () => ac.abort()
  }, [toFileRow, ensureRows, items])
 
  // React.useEffect(() => {
  //   virtualizer.measure()
  // }, [virtualizer])

  // console.log("Rerender?")
  // return <div style={{height: '1000px'}}><p>wat</p></div>
  return (
    <div ref={containerRef} style={{ height: dimensions.height, overflow: "auto", fontFamily: "monospace", fontSize: 12 }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        <div className="flex w-full gap-2 px-4 sr-only opacity-0 pointer-events-none" aria-hidden>
          <span>00000000</span>
          <div data-bytes className="grow" />
        </div>

        {items.map((v) => {
          const fileRow = toFileRow(v.index)
          if (fileRow >= rowCount) return null

          const bytes = getRowBytes(fileRow)
          const addr = (fileRow * bytesPerRow).toString(16).padStart(8, "0").toUpperCase()

          return (
            <div
              key={v.key}
              className="absolute w-full top-0 left-0 flex items-center gap-2 px-4 whitespace-pre"
              style={{ transform: `translateY(${v.start}px)`, height: v.size }}
            >
              <span style={{ opacity: 0.7 }}>{addr}</span>

                <div className="grow flex justify-between items-center" style={{ height: rowHeight }}>
                {Array.from({ length: bytesPerRow }, (_, i) => {
                  const b = bytes[i]
                  if (b === null) console.log("WAT?", bytes)
                  return (
                      <div className="text-center" style={{ width: cellWidth }}>{(b == null ? "··" : b.toString(16).padStart(2, "0").toUpperCase()) }</div>
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