import {
  CSSProperties,
  FunctionComponent,
  memo,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import {
  FixedSizeList,
  type FixedSizeList as FixedSizeListType
} from "react-window"

import { byteToAscii, byteToHex, formatAddress } from "@hexed/binary-utils"

import {
  addressColumnWidth,
  addressHexBorderWidth,
  asciiBorderWidth,
  asciiCharWidth,
  cellWidth,
  rowHeight
} from "./constants"
import { useCalculateRowLayout } from "./hooks/use-calculate-row-layout"
import { useVirtualFileBytes } from "./hooks/use-virtual-file-bytes"
import { cn } from "@hexed/ui"

const cellWidthStyle = { width: `${cellWidth}px` }
const asciiCharWidthStyle = { width: `${asciiCharWidth}px` }
const rowHeightStyle = { height: `${rowHeight}px` }
const addressColumnWidthStyle = { width: `${addressColumnWidth}px` }
const addressHexBorderWidthStyle = { width: `${addressHexBorderWidth}px` }
const asciiBorderWidthStyle = { width: `${asciiBorderWidth}px` }

const mockBytes = new Uint8Array([])

const highlight = "bg-chart-4/30 dark:bg-chart-4/20"
const highlightClasses = highlight.split(" ")

// Helper functions for DOM-based selection updates during drag
const updateSelectionStyles = (
  container: HTMLElement,
  range: { start: number; end: number } | null,
  rowStartOffset: number,
  bytesPerRow: number,
  fileSize?: number
) => {
  if (!range) {
    // Clear all selections
    container
      .querySelectorAll(".byte-cell.selected, .ascii-cell.selected")
      .forEach((el) => {
        el.classList.remove("selected", ...highlightClasses)
      })
    return
  }

  const minOffset = Math.min(range.start, range.end)
  const maxOffset = Math.max(range.start, range.end)

  // Update byte cells
  container.querySelectorAll(".byte-cell").forEach((el) => {
    const dataIndex = el.getAttribute("data-index")
    if (dataIndex === null) return
    const byteOffset = rowStartOffset + parseInt(dataIndex, 10)
    const isInRange =
      fileSize !== undefined &&
      byteOffset < fileSize &&
      byteOffset >= minOffset &&
      byteOffset <= maxOffset

    if (isInRange) {
      el.classList.add("selected", ...highlightClasses)
    } else {
      el.classList.remove("selected", ...highlightClasses)
    }
  })

  // Update ascii cells
  container.querySelectorAll(".ascii-cell").forEach((el) => {
    const dataIndex = el.getAttribute("data-index")
    if (dataIndex === null) return
    const byteOffset = rowStartOffset + parseInt(dataIndex, 10)
    const isInRange =
      fileSize !== undefined &&
      byteOffset < fileSize &&
      byteOffset >= minOffset &&
      byteOffset <= maxOffset

    if (isInRange) {
      el.classList.add("selected", ...highlightClasses)
    } else {
      el.classList.remove("selected", ...highlightClasses)
    }
  })
}

// Update all rows in a container for a given selection range
const updateAllRowsSelection = (
  container: HTMLElement,
  range: { start: number; end: number } | null,
  bytesPerRow: number,
  fileSize?: number
) => {
  if (!range) {
    // Clear all selections
    container
      .querySelectorAll(".byte-cell.selected, .ascii-cell.selected")
      .forEach((el) => {
        el.classList.remove("selected", ...highlightClasses)
      })
    return
  }

  const minOffset = Math.min(range.start, range.end)
  const maxOffset = Math.max(range.start, range.end)

  // Update all rows
  container.querySelectorAll(".byte-row").forEach((rowEl) => {
    const rowStartOffsetAttr = rowEl.getAttribute("data-row-start-offset")
    if (rowStartOffsetAttr === null) return
    const rowStartOffset = parseInt(rowStartOffsetAttr, 10)

    // Update byte cells in this row
    rowEl.querySelectorAll(".byte-cell").forEach((el) => {
      const dataIndex = el.getAttribute("data-index")
      if (dataIndex === null) return
      const byteOffset = rowStartOffset + parseInt(dataIndex, 10)
      const isInRange =
        fileSize !== undefined &&
        byteOffset < fileSize &&
        byteOffset >= minOffset &&
        byteOffset <= maxOffset

      if (isInRange) {
        el.classList.add("selected", ...highlightClasses)
      } else {
        el.classList.remove("selected", ...highlightClasses)
      }
    })

    // Update ascii cells in this row
    rowEl.querySelectorAll(".ascii-cell").forEach((el) => {
      const dataIndex = el.getAttribute("data-index")
      if (dataIndex === null) return
      const byteOffset = rowStartOffset + parseInt(dataIndex, 10)
      const isInRange =
        fileSize !== undefined &&
        byteOffset < fileSize &&
        byteOffset >= minOffset &&
        byteOffset <= maxOffset

      if (isInRange) {
        el.classList.add("selected", ...highlightClasses)
      } else {
        el.classList.remove("selected", ...highlightClasses)
      }
    })
  })
}

const ByteRowContentBase: FunctionComponent<{
  preview?: boolean
  addr: string
  bytesPerRow: number
  bytes: Uint8Array
  showAscii: boolean
  selectedOffsetRange?: { start: number; end: number } | null
  rowStartOffset: number
  onSelectedOffsetRangeChange?: (
    range: { start: number; end: number } | null
  ) => void
  dragState?: {
    isDragging: boolean
    initialOffset: number
    wasShiftPressed: boolean
  } | null
  dragSelectionRef?: React.MutableRefObject<{
    start: number
    end: number
  } | null>
  containerElement?: HTMLElement | null
  onDragStart?: (offset: number, shiftKey: boolean) => void
  onDragEnd?: () => void
  fileSize?: number
}> = ({
  preview = false,
  addr,
  bytesPerRow,
  bytes,
  showAscii,
  selectedOffsetRange,
  rowStartOffset,
  onSelectedOffsetRangeChange,
  dragState,
  dragSelectionRef,
  containerElement,
  onDragStart,
  onDragEnd,
  fileSize
}) => {
    const rowRef = useRef<HTMLDivElement | null>(null)

    const clearPairHover = useCallback(() => {
      const row = rowRef.current
      if (!row) return
      row.querySelectorAll(".pair-hover").forEach((el) => {
        el.classList.remove("pair-hover")
      })
    }, [])

    const setPairHover = useCallback(
      (i: number | null) => {
        const row = rowRef.current
        if (!row) return

        // clear previous
        row.querySelectorAll(".pair-hover").forEach((el) => {
          el.classList.remove("pair-hover")
        })

        if (i == null) return

        // add to BOTH the byte + ascii cells that share the same data-index
        row
          .querySelectorAll<HTMLElement>(`[data-index="${i}"]`)
          .forEach((el) => el.classList.add("pair-hover"))
      },
      []
    )

    // Sync DOM with React state when selection changes (not during drag)
    useEffect(() => {
      if (preview || dragState?.isDragging || !rowRef.current) return
      const range = selectedOffsetRange ?? null
      updateSelectionStyles(
        rowRef.current,
        range,
        rowStartOffset,
        bytesPerRow,
        fileSize
      )
    }, [selectedOffsetRange, rowStartOffset, bytesPerRow, fileSize, preview, dragState])

    // Helper function to check if a byte offset is selected
    const isByteSelected = (byteOffset: number): boolean => {
      if (!selectedOffsetRange) return false
      const { start, end } = selectedOffsetRange
      const minOffset = Math.min(start, end)
      const maxOffset = Math.max(start, end)
      return byteOffset >= minOffset && byteOffset <= maxOffset
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
      if (preview || !dragState?.isDragging) return

      const { initialOffset, wasShiftPressed } = dragState
      let newRange: { start: number; end: number }

      if (wasShiftPressed && selectedOffsetRange) {
        // Shift+drag: extend from existing selection
        // initialOffset is the anchor (the end we're NOT extending from)
        const { start, end } = selectedOffsetRange
        const minOffset = Math.min(start, end)
        const maxOffset = Math.max(start, end)

        // Determine which end is the anchor by checking which one matches initialOffset
        // The anchor should be one of the current selection boundaries
        if (
          Math.abs(initialOffset - minOffset) <
          Math.abs(initialOffset - maxOffset)
        ) {
          // Anchor is closer to start, so extend from end
          newRange = { start: minOffset, end: byteOffset }
        } else {
          // Anchor is closer to end, so extend from start
          newRange = { start: byteOffset, end: maxOffset }
        }
      } else {
        // Normal drag: select from initial offset to current offset
        newRange = { start: initialOffset, end: byteOffset }
      }

      // Update ref for drag selection (no rerender)
      if (dragSelectionRef) {
        dragSelectionRef.current = newRange
      }

      // Update DOM directly for visual feedback (no rerender)
      // Update all rows in the selection range, not just the current row
      if (containerElement) {
        updateAllRowsSelection(containerElement, newRange, bytesPerRow, fileSize)
      } else if (rowRef.current) {
        // Fallback to just updating current row if container not available
        updateSelectionStyles(
          rowRef.current,
          newRange,
          rowStartOffset,
          bytesPerRow,
          fileSize
        )
      }
    }

    return (
      <div
        style={!preview ? rowHeightStyle : undefined}
        ref={rowRef}
        data-row-start-offset={rowStartOffset}
        className={cn("byte-row flex items-center px-4 whitespace-pre hover:bg-muted", preview ? "h-full" : "")}
      >
        <div
          className="text-muted-foreground flex items-center h-full justify-center"
          style={addressColumnWidthStyle}
        >
          {addr}
        </div>
        <div
          className={`flex justify-center h-full ${!preview ? "opacity-0" : ""}`}
          style={addressHexBorderWidthStyle}
        >
          <div className="border-r h-full w-px" />
        </div>
        <div
          data-bytes
          className="grow flex items-center h-full"
        >
          {Array.from({ length: bytesPerRow }, (_, i) => {
            const byteOffset = rowStartOffset + i
            const byteExists = fileSize !== undefined && byteOffset < fileSize
            const byte = byteExists ? bytes[i] : undefined
            const isSelected = byteExists ? isByteSelected(byteOffset) : false

            return (
              <div
                key={i}
                data-index={i}
                className={cn(
                  "byte-cell text-center flex flex-1 items-center justify-center h-full select-none",
                  "hover:bg-chart-4/30 dark:hover:bg-chart-4/20",
                  "[&.pair-hover]:bg-chart-4/30 dark:[&.pair-hover]:bg-chart-4/20",
                  isSelected ? highlight : ""
                )}
                style={cellWidthStyle}
                onMouseDown={
                  byteExists
                    ? (e) => {
                      e.preventDefault()
                      handleByteMouseDown(byteOffset, e.shiftKey)
                    }
                    : undefined
                }
                onMouseEnter={
                  byteExists
                    ? () => {
                      setPairHover(i)
                      handleByteMouseEnter(byteOffset)
                    }
                    : undefined
                }
                onMouseLeave={() => clearPairHover()}
              >
                {!preview && byteExists ? byteToHex(byte!) : null}
              </div>
            )
          })}
        </div>
        {showAscii && (
          <>
            <div
              className={`flex justify-center h-full ${!preview ? "opacity-0" : ""}`}
              style={asciiBorderWidthStyle}
            >
              <div className="border-r h-full w-px" />
            </div>
            <div
              data-ascii
              className="flex items-center h-full"
              style={rowHeightStyle}
            >
              {Array.from({ length: bytesPerRow }, (_, i) => {
                const byteOffset = rowStartOffset + i
                const byteExists = fileSize !== undefined && byteOffset < fileSize
                const byte = byteExists ? bytes[i] : undefined
                const isSelected = byteExists ? isByteSelected(byteOffset) : false

                return (
                  <div
                    key={i}
                    data-index={i}
                    className={cn(
                      "ascii-cell text-center flex items-center justify-center h-full select-none",
                      "hover:bg-chart-4/30 dark:hover:bg-chart-4/20",
                      "[&.pair-hover]:bg-chart-4/30 dark:[&.pair-hover]:bg-chart-4/20",
                      isSelected ? highlight : ""
                    )}
                    onMouseDown={
                      byteExists
                        ? (e) => {
                          e.preventDefault()
                          handleByteMouseDown(byteOffset, e.shiftKey)
                        }
                        : undefined
                    }
                    onMouseEnter={
                      byteExists
                        ? () => {
                          setPairHover(i)
                          handleByteMouseEnter(byteOffset)
                        }
                        : undefined
                    }
                    onMouseLeave={() => clearPairHover()}
                  >
                    <div style={asciiCharWidthStyle}>
                      {!preview && byteExists ? byteToAscii(byte!) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

// Custom comparison function for ByteRowContent memoization
// Only rerender if props change AND the row's byte range intersects with selection changes
const arePropsEqual = (
  prevProps: React.ComponentProps<typeof ByteRowContentBase>,
  nextProps: React.ComponentProps<typeof ByteRowContentBase>
) => {
  // Check if non-selection props changed
  if (
    prevProps.preview !== nextProps.preview ||
    prevProps.addr !== nextProps.addr ||
    prevProps.bytesPerRow !== nextProps.bytesPerRow ||
    prevProps.bytes !== nextProps.bytes ||
    prevProps.showAscii !== nextProps.showAscii ||
    prevProps.rowStartOffset !== nextProps.rowStartOffset ||
    prevProps.fileSize !== nextProps.fileSize ||
    prevProps.dragState !== nextProps.dragState ||
    prevProps.dragSelectionRef !== nextProps.dragSelectionRef ||
    prevProps.onSelectedOffsetRangeChange !== nextProps.onSelectedOffsetRangeChange ||
    prevProps.onDragStart !== nextProps.onDragStart ||
    prevProps.onDragEnd !== nextProps.onDragEnd
  ) {
    return false
  }

  // Check if selection changed in a way that affects this row
  const prevRange = prevProps.selectedOffsetRange
  const nextRange = nextProps.selectedOffsetRange

  // If both are null, no change
  if (!prevRange && !nextRange) return true

  // If one is null and the other isn't, check if row intersects with selection
  if (!prevRange || !nextRange) {
    const range = prevRange || nextRange
    if (!range) return true
    const minOffset = Math.min(range.start, range.end)
    const maxOffset = Math.max(range.start, range.end)
    const rowStart = prevProps.rowStartOffset
    const rowEnd = rowStart + prevProps.bytesPerRow - 1
    // Row intersects if it overlaps with selection range
    return !(rowEnd >= minOffset && rowStart <= maxOffset)
  }

  // Both ranges exist - check if they're different AND affect this row
  const prevMin = Math.min(prevRange.start, prevRange.end)
  const prevMax = Math.max(prevRange.start, prevRange.end)
  const nextMin = Math.min(nextRange.start, nextRange.end)
  const nextMax = Math.max(nextRange.start, nextRange.end)

  // If ranges are the same, no change
  if (prevMin === nextMin && prevMax === nextMax) return true

  // Check if row intersects with either range
  const rowStart = prevProps.rowStartOffset
  const rowEnd = rowStart + prevProps.bytesPerRow - 1
  const intersectsPrev = rowEnd >= prevMin && rowStart <= prevMax
  const intersectsNext = rowEnd >= nextMin && rowStart <= nextMax

  // Only rerender if intersection status changed
  return intersectsPrev === intersectsNext
}

const ByteRowContent = memo(ByteRowContentBase, arePropsEqual)

export const HexVirtual: FunctionComponent<{
  containerRef: RefObject<HTMLDivElement | null>
  file: File | null
  dimensions: { width: number; height: number }
  showAscii: boolean
  chunkSize: number
  overscanCount: number
  selectedOffsetRange?: { start: number; end: number } | null
  onSelectedOffsetRangeChange?: (
    range: { start: number; end: number } | null
  ) => void
}> = ({
  containerRef,
  file,
  dimensions,
  showAscii,
  chunkSize,
  overscanCount,
  selectedOffsetRange,
  onSelectedOffsetRangeChange
}) => {
    // Use layout calculation hook
    const { bytesPerRow } = useCalculateRowLayout({
      showAscii,
      dimensions
    })

    const { rowCount, ensureRows, getRowBytes, fileSize } = useVirtualFileBytes({
      file,
      bytesPerRow,
      chunkSize // Load chunks of 128KB at a time
    })

    const listRef = useRef<FixedSizeListType | null>(null)
    // const overscanCount = 100

    // Track drag state for byte selection
    const [dragState, setDragState] = useState<{
      isDragging: boolean
      initialOffset: number
      wasShiftPressed: boolean
    } | null>(null)

    // Track selection during drag using ref (avoids rerenders)
    const dragSelectionRef = useRef<{ start: number; end: number } | null>(null)

    // Handle drag start
    const handleDragStart = useCallback(
      (offset: number, shiftKey: boolean) => {
        setDragState({
          isDragging: true,
          initialOffset: offset,
          wasShiftPressed: shiftKey
        })
        // Initialize drag selection ref with current selection or single byte
        if (shiftKey && selectedOffsetRange) {
          // Will be updated in handleByteMouseEnter
          dragSelectionRef.current = selectedOffsetRange
        } else {
          dragSelectionRef.current = { start: offset, end: offset }
        }
      },
      [selectedOffsetRange]
    )

    // Handle drag end - commit ref to state
    const handleDragEnd = useCallback(() => {
      // Commit drag selection to state (single rerender)
      if (dragSelectionRef.current && onSelectedOffsetRangeChange) {
        onSelectedOffsetRangeChange(dragSelectionRef.current)
      }
      // Clear drag state
      setDragState(null)
      dragSelectionRef.current = null
    }, [onSelectedOffsetRangeChange])

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

    // Track last fetched range to avoid redundant calls
    const lastFetchedRangeRef = useRef<{
      startIndex: number
      stopIndex: number
    } | null>(null)
    const initialFetchDoneRef = useRef(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    const handleItemsRendered = useCallback(
      ({
        visibleStartIndex,
        visibleStopIndex
      }: {
        overscanStartIndex: number
        overscanStopIndex: number
        visibleStartIndex: number
        visibleStopIndex: number
      }) => {
        if (!file || rowCount === 0) return

        // Check if range has changed to avoid redundant fetches
        const lastRange = lastFetchedRangeRef.current
        if (
          lastRange &&
          lastRange.startIndex === visibleStartIndex &&
          lastRange.stopIndex === visibleStopIndex
        ) {
          return
        }

        // Abort previous fetch if still pending
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        // Update refs
        lastFetchedRangeRef.current = {
          startIndex: visibleStartIndex,
          stopIndex: visibleStopIndex
        }
        initialFetchDoneRef.current = true

        // Fetch data for visible items - indices directly map to file rows
        const ac = new AbortController()
        abortControllerRef.current = ac
        ensureRows(visibleStartIndex, visibleStopIndex, ac.signal).catch(
          (err) => {
            if (err?.name !== "AbortError") console.error(err)
          }
        )
      },
      [file, rowCount, ensureRows]
    )

    // Reset fetch tracking when file changes
    useEffect(() => {
      lastFetchedRangeRef.current = null
      initialFetchDoneRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }, [file])

    // Handle initial fetch if handleItemsRendered hasn't been called yet
    useEffect(() => {
      if (!file || rowCount === 0 || initialFetchDoneRef.current) return

      // If no visible range yet but we have rows, try to fetch initial visible range
      const estimatedVisibleRows =
        Math.ceil(dimensions.height / rowHeight) + overscanCount
      const initialStart = 0
      const initialEnd = Math.min(estimatedVisibleRows - 1, rowCount - 1)

      // Abort previous fetch if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const ac = new AbortController()
      abortControllerRef.current = ac
      ensureRows(initialStart, initialEnd, ac.signal).catch((err) => {
        if (err?.name !== "AbortError") console.error(err)
      })

      lastFetchedRangeRef.current = {
        startIndex: initialStart,
        stopIndex: initialEnd
      }
      initialFetchDoneRef.current = true

      return () => {
        ac.abort()
      }
    }, [
      file,
      ensureRows,
      rowCount,
      dimensions.height,
      rowHeight,
      overscanCount
    ])

    // Cleanup abort controller on unmount
    useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }, [])
    console.log("HexVirtual Render")

    const Row = useCallback(
      ({ index, style }: { index: number; style: CSSProperties }) => {
        // Index directly corresponds to file row
        if (index >= rowCount) return null

        const bytes = getRowBytes(index)
        const rowStartOffset = index * bytesPerRow
        const addr = formatAddress(rowStartOffset) // (index * bytesPerRow).toString(16).padStart(8, "0").toUpperCase()

        return (
          <div style={{
            position: "absolute",
            transform: `translateY(${style.top}px)`,
            width: "100%",
          }}>
            <ByteRowContent
              // style={style}
              addr={addr}
              bytesPerRow={bytesPerRow}
              bytes={bytes}
              showAscii={showAscii}
              selectedOffsetRange={selectedOffsetRange}
              rowStartOffset={rowStartOffset}
              onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
              dragState={dragState}
              dragSelectionRef={dragSelectionRef}
              containerElement={containerRef.current}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              fileSize={fileSize}
            />
          </div>
        )
      },
      [
        rowCount,
        getRowBytes,
        bytesPerRow,
        rowHeight,
        showAscii,
        selectedOffsetRange,
        onSelectedOffsetRangeChange,
        dragState,
        handleDragStart,
        handleDragEnd
      ]
    )

    const containerStyle = useMemo(
      () => ({
        height: dimensions.height,
        fontFamily: "monospace",
        fontSize: 12
      }),
      [dimensions.height]
    )

    return (
      <div
        style={containerStyle}
        className="relative"
      >
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
          <ByteRowContent
            preview
            // style={{ height: dimensions.height }}
            addr={""}
            bytesPerRow={bytesPerRow}
            bytes={mockBytes}
            showAscii={showAscii}
            selectedOffsetRange={null}
            rowStartOffset={0}
            onSelectedOffsetRangeChange={undefined}
            dragState={null}
            dragSelectionRef={undefined}
            onDragStart={undefined}
            onDragEnd={undefined}
            fileSize={fileSize}
          />
        </div>
      </div>
    )
  }
