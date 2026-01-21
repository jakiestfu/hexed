import {
  FunctionComponent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from "react"
import { formatAddress } from "@hexed/binary-utils"
import {
  addressColumnWidth,
  addressHexBorderWidth,
  asciiBorderWidth,
  rowHeight
} from "../constants"
import { cn } from "@hexed/ui"
import { isByteSelected, shouldCacheIfSelectionChanged, type SelectionRange } from "../utils/selection-helpers"
import { updateSelectionStyles } from "../utils/selection-dom"
import { useByteSelection } from "../hooks/use-byte-selection"
import type { DragState } from "../hooks/use-drag-selection"
import { ByteCell } from "./byte-cell"
import { AsciiCell } from "./ascii-cell"

const rowHeightStyle = { height: `${rowHeight}px` }
const addressColumnWidthStyle = { width: `${addressColumnWidth}px` }
const addressHexBorderWidthStyle = { width: `${addressHexBorderWidth}px` }
const asciiBorderWidthStyle = { width: `${asciiBorderWidth}px` }

export type ByteRowContentProps = {
  preview?: boolean
  addr: string
  bytesPerRow: number
  bytes: Uint8Array
  showAscii: boolean
  selectedOffsetRange?: SelectionRange
  rowStartOffset: number
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

const ByteRowContentBase: FunctionComponent<ByteRowContentProps> = ({
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

  const { handleByteMouseDown, handleByteMouseEnter } = useByteSelection({
    preview,
    selectedOffsetRange,
    onSelectedOffsetRangeChange,
    dragState,
    dragSelectionRef,
    containerElement,
    rowStartOffset,
    bytesPerRow,
    fileSize
  })

  // const rowHasBytes = useMemo(() => {
  //   return Array.from({ length: bytesPerRow }, (_, i) => {
  //     const byteOffset = rowStartOffset + i
  //     const byteExists = fileSize !== undefined && byteOffset < fileSize
  //     const byte = byteExists ? bytes[i] : undefined
  //     return byte !== undefined
  //   }).some(byteExists => byteExists)
  // }, [fileSize, rowStartOffset, bytesPerRow])
  const rowHasBytes = true;

  return (
    <div
      style={!preview ? rowHeightStyle : undefined}
      ref={rowRef}
      data-row-start-offset={rowStartOffset}
      className={cn(
        "byte-row flex items-center px-4 whitespace-pre hover:bg-muted",
        preview ? "h-full" : ""
      )}
    >
      <div
        className={cn("text-muted-foreground flex items-center h-full justify-center", rowHasBytes ? "opacity-100" : "opacity-0")}
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
      <div data-bytes className="grow flex items-center h-full">
        {Array.from({ length: bytesPerRow }, (_, i) => {
          const byteOffset = rowStartOffset + i
          const byteExists = fileSize !== undefined && byteOffset < fileSize
          const byte = byteExists ? bytes[i] : undefined
          const isSelected = byteExists
            ? isByteSelected(byteOffset, selectedOffsetRange)
            : false

          return (
            <ByteCell
              key={i}
              byteOffset={byteOffset}
              byte={byte}
              byteExists={byteExists}
              isSelected={isSelected}
              index={i}
              onMouseDown={
                byteExists
                  ? (e) => {
                    e.preventDefault()
                    handleByteMouseDown(byteOffset, e.shiftKey, onDragStart)
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
              onMouseLeave={clearPairHover}
            />
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
          <div data-ascii className="flex items-center h-full" style={rowHeightStyle}>
            {Array.from({ length: bytesPerRow }, (_, i) => {
              const byteOffset = rowStartOffset + i
              const byteExists = fileSize !== undefined && byteOffset < fileSize
              const byte = byteExists ? bytes[i] : undefined
              const isSelected = byteExists
                ? isByteSelected(byteOffset, selectedOffsetRange)
                : false

              return (
                <AsciiCell
                  key={i}
                  byteOffset={byteOffset}
                  byte={byte}
                  byteExists={byteExists}
                  isSelected={isSelected}
                  index={i}
                  preview={preview}
                  onMouseDown={
                    byteExists
                      ? (e) => {
                        e.preventDefault()
                        handleByteMouseDown(byteOffset, e.shiftKey, onDragStart)
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
                  onMouseLeave={clearPairHover}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export const ByteRowContent = memo(ByteRowContentBase, (prev, next) => {

  if (prev.bytesPerRow !== next.bytesPerRow) {
    return false;
  }

  // console.log("ByteRowContent Memo Compare", prev, next)

  const result = shouldCacheIfSelectionChanged(prev, next)
  // if (result) {
  //   console.log("Should Cache?")
  // } else {
  //   console.log("Should NOT Cache?")
  // }
  return result;
})
