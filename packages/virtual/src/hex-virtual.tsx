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
  selectedOffsetRange?: { start: number; end: number } | null
  rowStartOffset: number
  onSelectedOffsetRangeChange?: (range: { start: number; end: number } | null) => void
  dragState?: { isDragging: boolean; initialOffset: number; wasShiftPressed: boolean } | null
  onDragStart?: (offset: number, shiftKey: boolean) => void
  onDragEnd?: () => void
  hoveredOffset?: number | null
  onHoveredOffsetChange?: (offset: number | null) => void
}> = ({ preview, style, addr, bytesPerRow, bytes, showAscii, selectedOffsetRange, rowStartOffset, onSelectedOffsetRangeChange, dragState, onDragStart, onDragEnd, hoveredOffset, onHoveredOffsetChange }) => {
  // Helper function to check if a byte offset is selected
  const isByteSelected = (byteOffset: number): boolean => {
    if (!selectedOffsetRange) return false
    const { start, end } = selectedOffsetRange
    const minOffset = Math.min(start, end)
    const maxOffset = Math.max(start, end)
    return byteOffset >= minOffset && byteOffset <= maxOffset
  }

  // Helper function to check if a byte offset is hovered
  const isByteHovered = (byteOffset: number): boolean => {
    return hoveredOffset === byteOffset
  }

  // Handle byte cell mouse down
  const handleByteMouseDown = (byteOffset: number, shiftKey: boolean) => {
    if (preview || !onSelectedOffsetRangeChange) return

    if (shiftKey) {
      // Shift+click: extend selection
      if (selectedOffsetRange) {
        const { start, end } = selectedOffsetRange
        const minOffset = Math.min(start, end)
        const maxOffset = Math.max(start, end)

        // Extend from the closest end to the clicked byte
        const distanceToStart = Math.abs(byteOffset - minOffset)
        const distanceToEnd = Math.abs(byteOffset - maxOffset)

        let anchorOffset: number
        if (distanceToStart < distanceToEnd) {
          // Extend from start - anchor is the end
          anchorOffset = maxOffset
          onSelectedOffsetRangeChange({ start: byteOffset, end: maxOffset })
        } else {
          // Extend from end - anchor is the start
          anchorOffset = minOffset
          onSelectedOffsetRangeChange({ start: minOffset, end: byteOffset })
        }

        // Start drag tracking with the anchor offset (the end we're NOT extending from)
        if (onDragStart) {
          onDragStart(anchorOffset, shiftKey)
        }
      } else {
        // No existing selection, select from 0 to clicked byte
        onSelectedOffsetRangeChange({ start: 0, end: byteOffset })
        // Start drag tracking from 0
        if (onDragStart) {
          onDragStart(0, shiftKey)
        }
      }
    } else {
      // Single click: toggle or select single byte
      if (selectedOffsetRange) {
        const { start, end } = selectedOffsetRange
        const minOffset = Math.min(start, end)
        const maxOffset = Math.max(start, end)

        // If clicking the only selected byte, deselect
        if (minOffset === maxOffset && byteOffset === minOffset) {
          onSelectedOffsetRangeChange(null)
          return
        }
      }

      // Start new selection (will be extended on drag)
      onSelectedOffsetRangeChange({ start: byteOffset, end: byteOffset })

      // Start drag tracking
      if (onDragStart) {
        onDragStart(byteOffset, shiftKey)
      }
    }
  }

  // Handle byte cell mouse enter (for drag selection)
  const handleByteMouseEnter = (byteOffset: number) => {
    if (preview || !onSelectedOffsetRangeChange || !dragState?.isDragging) return

    const { initialOffset, wasShiftPressed } = dragState

    if (wasShiftPressed && selectedOffsetRange) {
      // Shift+drag: extend from existing selection
      // initialOffset is the anchor (the end we're NOT extending from)
      const { start, end } = selectedOffsetRange
      const minOffset = Math.min(start, end)
      const maxOffset = Math.max(start, end)

      // Determine which end is the anchor by checking which one matches initialOffset
      // The anchor should be one of the current selection boundaries
      if (Math.abs(initialOffset - minOffset) < Math.abs(initialOffset - maxOffset)) {
        // Anchor is closer to start, so extend from end
        onSelectedOffsetRangeChange({ start: minOffset, end: byteOffset })
      } else {
        // Anchor is closer to end, so extend from start
        onSelectedOffsetRangeChange({ start: byteOffset, end: maxOffset })
      }
    } else {
      // Normal drag: select from initial offset to current offset
      onSelectedOffsetRangeChange({ start: initialOffset, end: byteOffset })
    }
  }

  return (
    <div 
      className="flex items-center px-4 whitespace-pre hover:bg-muted" 
      style={style}
      onMouseLeave={() => {
        onHoveredOffsetChange?.(null)
      }}
    >
      <div className="text-muted-foreground flex items-center h-full justify-center" style={addressColumnWidthStyle}>
        {addr}
      </div>
      <div className={`flex justify-center h-full ${!preview ? 'opacity-0' : ''}`} style={addressHexBorderWidthStyle}>
        <div className="border-r h-full w-px" />
      </div>
      <div data-bytes className="grow flex justify-between items-center" style={rowHeightStyle}>
        {Array.from({ length: bytesPerRow }, (_, i) => {
          const byte = bytes[i]
          const byteOffset = rowStartOffset + i
          const isSelected = isByteSelected(byteOffset)
          const isHovered = isByteHovered(byteOffset)

          return (
            <div
              key={i}
              className={`text-center ${isSelected ? 'bg-chart-4/30' : ''} ${isHovered ? 'bg-chart-4/30' : ''} flex items-center justify-center h-full select-none`}
              style={cellWidthStyle}
              onMouseDown={(e) => {
                e.preventDefault()
                handleByteMouseDown(byteOffset, e.shiftKey)
              }}
              onMouseEnter={() => {
                onHoveredOffsetChange?.(byteOffset)
                handleByteMouseEnter(byteOffset)
              }}
              onMouseLeave={() => {
                onHoveredOffsetChange?.(null)
              }}
            >
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
              const byteOffset = rowStartOffset + i
              const isSelected = isByteSelected(byteOffset)
              const isHovered = isByteHovered(byteOffset)

              return (
                <div
                  key={i}
                  className={`text-center ${isSelected ? 'bg-chart-4/30' : ''} ${isHovered ? 'bg-chart-4/30' : ''} flex items-center justify-center h-full select-none`}
                  style={asciiCharWidthStyle}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleByteMouseDown(byteOffset, e.shiftKey)
                  }}
                  onMouseEnter={() => {
                    onHoveredOffsetChange?.(byteOffset)
                    handleByteMouseEnter(byteOffset)
                  }}
                  onMouseLeave={() => {
                    onHoveredOffsetChange?.(null)
                  }}
                >
                  {!preview ? byteToAscii(byte) : null}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export const HexVirtual: FunctionComponent<{
  containerRef: RefObject<HTMLDivElement | null>
  file: File | null
  dimensions: { width: number; height: number }
  showAscii: boolean
  chunkSize: number;
  overscanCount: number;
  selectedOffsetRange?: { start: number; end: number } | null;
  onSelectedOffsetRangeChange?: (range: { start: number; end: number } | null) => void;
}> = ({ containerRef, file, dimensions, showAscii, chunkSize, overscanCount, selectedOffsetRange, onSelectedOffsetRangeChange }) => {
  // Use layout calculation hook
  const { bytesPerRow } = useCalculateRowLayout({
    showAscii,
    dimensions,
  })

  const { rowCount, ensureRows, getRowBytes } = useVirtualFileBytes({
    file,
    bytesPerRow,
    chunkSize, // Load chunks of 128KB at a time
  })

  const listRef = useRef<FixedSizeListType | null>(null)
  // const overscanCount = 100

  // Track hover state for byte highlighting
  const [hoveredOffset, setHoveredOffset] = useState<number | null>(null)

  // Track drag state for byte selection
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    initialOffset: number
    wasShiftPressed: boolean
  } | null>(null)

  // Handle drag start
  const handleDragStart = useCallback((offset: number, shiftKey: boolean) => {
    setDragState({
      isDragging: true,
      initialOffset: offset,
      wasShiftPressed: shiftKey,
    })
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState(null)
  }, [])

  // Handle hover state change
  const handleHoveredOffsetChange = useCallback((offset: number | null) => {
    setHoveredOffset(offset)
  }, [])

  // Set up document-level mouse up handler to end drag
  useEffect(() => {
    if (!dragState?.isDragging) return

    const handleMouseUp = () => {
      handleDragEnd()
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragState, handleDragEnd])

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
      const rowStartOffset = index * bytesPerRow
      const addr = formatAddress(rowStartOffset)// (index * bytesPerRow).toString(16).padStart(8, "0").toUpperCase()

      return (
        <ByteRow
          style={style}
          addr={addr}
          bytesPerRow={bytesPerRow}
          bytes={bytes}
          showAscii={showAscii}
          selectedOffsetRange={selectedOffsetRange}
          rowStartOffset={rowStartOffset}
          onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          hoveredOffset={hoveredOffset}
          onHoveredOffsetChange={handleHoveredOffsetChange}
        />
      )
    },
    [rowCount, getRowBytes, bytesPerRow, rowHeight, showAscii, selectedOffsetRange, onSelectedOffsetRangeChange, dragState, handleDragStart, handleDragEnd, hoveredOffset, handleHoveredOffsetChange]
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
        <ByteRow preview style={{ height: dimensions.height }} addr={""} bytesPerRow={bytesPerRow} bytes={mockBytes} showAscii={showAscii} selectedOffsetRange={null} rowStartOffset={0} onSelectedOffsetRangeChange={undefined} dragState={null} onDragStart={undefined} onDragEnd={undefined} hoveredOffset={null} onHoveredOffsetChange={undefined} />
      </div>
    </div>
  )
}