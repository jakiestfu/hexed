import { FixedSizeList, type FixedSizeList as FixedSizeListType } from "react-window"
import { useVirtualFileBytes } from "./hooks/use-virtual-file-bytes"
import { useCalculateRowLayout } from "./hooks/use-calculate-row-layout"
import {
  cellWidth,
  rowHeight,
  asciiCharWidth,
  addressColumnWidth,
  addressHexBorderWidth,
  asciiBorderWidth,
} from "./constants"
import { useMemo, useState, useRef, RefObject, CSSProperties, FunctionComponent, useCallback, useEffect } from "react"
import { byteToAscii, byteToHex, formatAddress } from "@hexed/binary-utils"

type HexViewerProps = {
  containerRef: RefObject<HTMLDivElement | null>
  file: File | null
  dimensions: { width: number; height: number }
  showAscii: boolean
}

const cellWidthStyle = { width: `${cellWidth}px` }
const asciiCharWidthStyle = { width: `${asciiCharWidth}px` }
const rowHeightStyle = { height: `${rowHeight}px` }
const addressColumnWidthStyle = { width: `${addressColumnWidth}px` }
const addressHexBorderWidthStyle = { width: `${addressHexBorderWidth}px` }
const asciiBorderWidthStyle = { width: `${asciiBorderWidth}px` }

const mockBytes = new Uint8Array([])

const ByteRow: FunctionComponent<{
  preview?: boolean
  style: CSSProperties
  addr: string
  bytesPerRow: number
  bytes: Uint8Array
  showAscii: boolean
}> = ({ preview, style, addr, bytesPerRow, bytes, showAscii }) => (
  <div className="flex items-center px-4 whitespace-pre hover:bg-muted" style={style}>
    <div className="text-muted-foreground flex items-center h-full justify-center" style={addressColumnWidthStyle}>
      {addr}
    </div>
    <div className={`flex justify-center h-full ${!preview ? 'opacity-0' : ''}`} style={addressHexBorderWidthStyle}>
      <div className="border-r h-full w-px" />
    </div>
    <div data-bytes className="grow flex justify-between items-center" style={rowHeightStyle}>
      {Array.from({ length: bytesPerRow }, (_, i) => {
        const byte = bytes[i]

        return (
          <div key={i} className={`text-center hover:bg-chart-4/30 flex items-center justify-center h-full`} style={cellWidthStyle}>
            {!preview ? byteToHex(byte) : null}
          </div>
        )
      })}
    </div>
    {showAscii && (
      <>
        <div className={`flex justify-center h-full ${!preview ? 'opacity-0' : ''}`} style={asciiBorderWidthStyle}>
          <div className="border-r h-full w-px" />
        </div>
        <div data-ascii className="flex items-center h-full" style={rowHeightStyle}>
          {Array.from({ length: bytesPerRow }, (_, i) => {
            const byte = bytes[i]

            return (
              <div key={i} className={`text-center hover:bg-chart-4/30 flex items-center justify-center h-full`} style={asciiCharWidthStyle}>
                {!preview ? byteToAscii(byte) : null}
              </div>
            )
          })}
        </div>
      </>
    )}
  </div>
)

export function HexVirtual({ containerRef, file, dimensions, showAscii }: HexViewerProps) {
  // Use layout calculation hook
  const { bytesPerRow } = useCalculateRowLayout({
    showAscii,
    dimensions,
  })

  const { rowCount, ensureRows, getRowBytes } = useVirtualFileBytes({
    file,
    bytesPerRow,
    chunkSize: 128 * 1024, // Load chunks of 128KB at a time
  })

  const listRef = useRef<FixedSizeListType | null>(null)
  const overscanCount = 100

  // Create a callback ref to sync outerRef with containerRef
  const handleOuterRef = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element
    },
    [containerRef]
  )

  // Track visible range for data fetching
  const [visibleRange, setVisibleRange] = useState<{
    startIndex: number
    stopIndex: number
  } | null>(null)

  const handleItemsRendered = useCallback(
    ({
      visibleStartIndex,
      visibleStopIndex,
    }: {
      overscanStartIndex: number
      overscanStopIndex: number
      visibleStartIndex: number
      visibleStopIndex: number
    }) => {
      setVisibleRange({ startIndex: visibleStartIndex, stopIndex: visibleStopIndex })
    },
    []
  )

  // Prefetch bytes for visible+overscan rows
  useEffect(() => {
    if (!file || rowCount === 0) return

    if (visibleRange === null) {
      // If no visible range yet but we have rows, try to fetch initial visible range
      const estimatedVisibleRows = Math.ceil(dimensions.height / rowHeight) + overscanCount
      const initialStart = 0
      const initialEnd = Math.min(estimatedVisibleRows - 1, rowCount - 1)
      const ac = new AbortController()
      ensureRows(initialStart, initialEnd, ac.signal).catch((err) => {
        if (err?.name !== "AbortError") console.error(err)
      })
      return () => ac.abort()
    }

    // Fetch data for visible items - indices directly map to file rows
    const ac = new AbortController()
    ensureRows(visibleRange.startIndex, visibleRange.stopIndex, ac.signal).catch((err) => {
      if (err?.name !== "AbortError") console.error(err)
    })
    return () => ac.abort()
  }, [file, ensureRows, visibleRange, rowCount, dimensions.height, rowHeight, overscanCount])

  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      // Index directly corresponds to file row
      if (index >= rowCount) return null

      const bytes = getRowBytes(index)
      const addr = formatAddress(index * bytesPerRow)// (index * bytesPerRow).toString(16).padStart(8, "0").toUpperCase()

      return (
        <ByteRow
          style={style}
          addr={addr}
          bytesPerRow={bytesPerRow}
          bytes={bytes}
          showAscii={showAscii}
        />
      )
    },
    [rowCount, getRowBytes, bytesPerRow, rowHeight, showAscii]
  )

  const containerStyle = useMemo(() => ({ height: dimensions.height, fontFamily: "monospace", fontSize: 12 }), [dimensions.height])

  return (
    <div style={containerStyle} className="relative">
      <FixedSizeList
        ref={listRef}
        outerRef={handleOuterRef}
        height={dimensions.height}
        width={dimensions.width}
        itemCount={rowCount}
        itemSize={rowHeight}
        overscanCount={overscanCount}
        onItemsRendered={handleItemsRendered}
      >
        {Row}
      </FixedSizeList>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <ByteRow preview style={{ height: dimensions.height }} addr={""} bytesPerRow={bytesPerRow} bytes={mockBytes} showAscii={showAscii} />
      </div>
    </div>
  )
}