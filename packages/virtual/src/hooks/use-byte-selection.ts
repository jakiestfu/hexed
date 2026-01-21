import { useCallback } from "react"
import type { SelectionRange } from "../utils/selection-helpers"
import { calculateSelectionRange } from "../utils/selection-helpers"
import { updateAllRowsSelection, updateSelectionStyles } from "../utils/selection-dom"
import type { DragState } from "./use-drag-selection"

export function useByteSelection({
  preview,
  selectedOffsetRange,
  onSelectedOffsetRangeChange,
  dragState,
  dragSelectionRef,
  containerElement,
  rowStartOffset,
  bytesPerRow,
  fileSize
}: {
  preview?: boolean
  selectedOffsetRange?: SelectionRange
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
  dragState?: DragState
  dragSelectionRef?: React.MutableRefObject<{ start: number; end: number } | null>
  containerElement?: HTMLElement | null
  rowStartOffset: number
  bytesPerRow: number
  fileSize?: number
}) {
  // Handle byte cell mouse down
  const handleByteMouseDown = useCallback(
    (
      byteOffset: number,
      shiftKey: boolean,
      onDragStart?: (offset: number, shiftKey: boolean) => void
    ) => {
      // debugger;
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
    },
    [preview, onSelectedOffsetRangeChange, selectedOffsetRange]
  )

  // Handle byte cell mouse enter (for drag selection)
  const handleByteMouseEnter = useCallback(
    (byteOffset: number) => {
      if (preview || !dragState?.isDragging) return

      const newRange = calculateSelectionRange(
        byteOffset,
        dragState,
        selectedOffsetRange
      )

      // Update ref for drag selection (no rerender)
      if (dragSelectionRef) {
        dragSelectionRef.current = newRange
      }

      // Update DOM directly for visual feedback (no rerender)
      // Update all rows in the selection range, not just the current row
      if (containerElement) {
        updateAllRowsSelection(containerElement, newRange, bytesPerRow, fileSize)
      } else {
        // Fallback: update via a ref callback would be needed
        // For now, this case shouldn't happen in normal usage
      }
    },
    [
      preview,
      dragState,
      selectedOffsetRange,
      dragSelectionRef,
      containerElement,
      bytesPerRow,
      fileSize
    ]
  )

  return {
    handleByteMouseDown,
    handleByteMouseEnter
  }
}
