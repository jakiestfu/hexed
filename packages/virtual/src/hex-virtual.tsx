import {
  FunctionComponent,
  RefObject,
  useCallback,
  useMemo,
  useRef
} from "react"
import { FixedSizeList } from "react-window"
import { rowHeight } from "./constants"
import { useCalculateRowLayout } from "./hooks/use-calculate-row-layout"
import { useVirtualFileBytes } from "./hooks/use-virtual-file-bytes"
import { useDragSelection } from "./hooks/use-drag-selection"
import { useVisibleRangeFetch } from "./hooks/use-visible-range-fetch"
import { VirtualRow } from "./components/virtual-row"
import { ByteRowContent } from "./components/byte-row-content"
import type { SelectionRange } from "./utils/selection-helpers"

const mockBytes = new Uint8Array([])

export const HexVirtual: FunctionComponent<{
  containerRef: RefObject<HTMLDivElement | null>
  file: File | null
  dimensions: { width: number; height: number }
  showAscii: boolean
  chunkSize: number
  overscanCount: number
  selectedOffsetRange?: SelectionRange
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
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
      chunkSize
    })

    // Use drag selection hook
    const { dragState, dragSelectionRef, handleDragStart, handleDragEnd } =
      useDragSelection(selectedOffsetRange, onSelectedOffsetRangeChange)

    // Use visible range fetch hook
    const { handleItemsRendered } = useVisibleRangeFetch({
      file,
      rowCount,
      ensureRows,
      dimensions,
      overscanCount
    })

    // Create a callback ref to sync outerRef with containerRef
    const handleOuterRef = useCallback(
      (element: HTMLDivElement | null) => {
        containerRef.current = element
      },
      [containerRef]
    )

    const Row = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        return (
          <VirtualRow
            index={index}
            style={style}
            rowCount={rowCount}
            bytesPerRow={bytesPerRow}
            getRowBytes={getRowBytes}
            showAscii={showAscii}
            selectedOffsetRange={selectedOffsetRange}
            onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
            dragState={dragState}
            dragSelectionRef={dragSelectionRef}
            containerElement={containerRef.current}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            fileSize={fileSize}
          />
        )
      },
      [
        rowCount,
        getRowBytes,
        bytesPerRow,
        showAscii,
        selectedOffsetRange,
        onSelectedOffsetRangeChange,
        dragState,
        dragSelectionRef,
        containerRef,
        handleDragStart,
        handleDragEnd,
        fileSize
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
    console.log("HexVirtual Render")
    return (
      <div style={containerStyle} className="relative">
        <FixedSizeList
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
            addr={""}
            bytesPerRow={bytesPerRow}
            bytes={mockBytes}
            showAscii={showAscii}
            selectedOffsetRange={null}
            rowStartOffset={0}
            onSelectedOffsetRangeChange={undefined}
            dragState={null}
            dragSelectionRef={undefined}
            containerElement={undefined}
            onDragStart={undefined}
            onDragEnd={undefined}
            fileSize={fileSize}
          />
        </div>
      </div>
    )
  }
