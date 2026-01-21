import { FunctionComponent, CSSProperties } from "react"
import { formatAddress } from "@hexed/binary-utils"
import { ByteRowContent, type ByteRowContentProps } from "./byte-row-content"
import type { SelectionRange } from "../utils/selection-helpers"
import type { DragState } from "../hooks/use-drag-selection"

export type VirtualRowProps = {
  index: number
  style: CSSProperties
  rowCount: number
  bytesPerRow: number
  getRowBytes: (index: number) => Uint8Array
  showAscii: boolean
  selectedOffsetRange?: SelectionRange
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
  dragState?: DragState
  dragSelectionRef?: React.MutableRefObject<{
    start: number
    end: number
  } | null>
  containerElement?: HTMLElement | null
  onDragStart?: (offset: number, shiftKey: boolean) => void
  onDragEnd?: () => void
  fileSize?: number
}

export const VirtualRow: FunctionComponent<VirtualRowProps> = ({
  index,
  style,
  rowCount,
  bytesPerRow,
  getRowBytes,
  showAscii,
  selectedOffsetRange,
  onSelectedOffsetRangeChange,
  dragState,
  dragSelectionRef,
  containerElement,
  onDragStart,
  onDragEnd,
  fileSize
}) => {
  // Index directly corresponds to file row
  if (index >= rowCount) return null

  const bytes = getRowBytes(index)
  const rowStartOffset = index * bytesPerRow
  const addr = formatAddress(rowStartOffset)

  return (
    <div
      style={{
        position: "absolute",
        transform: `translateY(${style.top}px)`,
        width: "100%"
      }}
    >
      <ByteRowContent
        addr={addr}
        bytesPerRow={bytesPerRow}
        bytes={bytes}
        showAscii={showAscii}
        selectedOffsetRange={selectedOffsetRange}
        rowStartOffset={rowStartOffset}
        onSelectedOffsetRangeChange={onSelectedOffsetRangeChange}
        dragState={dragState}
        dragSelectionRef={dragSelectionRef}
        containerElement={containerElement}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        fileSize={fileSize}
      />
    </div>
  )
}
