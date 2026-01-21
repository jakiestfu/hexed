import { useCallback, useEffect, useRef, useState } from "react"

import type { SelectionRange } from "../utils/selection-helpers"

export type DragState = {
  isDragging: boolean
  initialOffset: number
  wasShiftPressed: boolean
} | null

export function useDragSelection(
  selectedOffsetRange?: SelectionRange,
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
) {
  // Track drag state for byte selection
  const [dragState, setDragState] = useState<DragState>(null)

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

  return {
    dragState,
    dragSelectionRef,
    handleDragStart,
    handleDragEnd
  }
}
