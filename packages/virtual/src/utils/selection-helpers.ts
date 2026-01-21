export type SelectionRange = { start: number; end: number } | null

// Helper function to check if a byte offset is selected
export const isByteSelected = (
  byteOffset: number,
  selectedOffsetRange?: SelectionRange
): boolean => {
  if (!selectedOffsetRange) return false
  const { start, end } = selectedOffsetRange
  const minOffset = Math.min(start, end)
  const maxOffset = Math.max(start, end)
  return byteOffset >= minOffset && byteOffset <= maxOffset
}

// Calculate new selection range during drag
export const calculateSelectionRange = (
  byteOffset: number,
  dragState: {
    isDragging: boolean
    initialOffset: number
    wasShiftPressed: boolean
  },
  selectedOffsetRange?: SelectionRange
): { start: number; end: number } => {
  const { initialOffset, wasShiftPressed } = dragState

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
      return { start: minOffset, end: byteOffset }
    } else {
      // Anchor is closer to end, so extend from start
      return { start: byteOffset, end: maxOffset }
    }
  } else {
    // Normal drag: select from initial offset to current offset
    return { start: initialOffset, end: byteOffset }
  }
}

// Custom comparison function for ByteRowContent memoization
// Only rerender if props change AND the row's byte range intersects with selection changes
export const shouldCacheIfSelectionChanged = <T extends { selectedOffsetRange?: SelectionRange; rowStartOffset: number; bytesPerRow: number }>(
  prevProps: T,
  nextProps: T
): boolean => {
  // Check if selection changed in a way that affects this row
  const prevRange = prevProps.selectedOffsetRange
  const nextRange = nextProps.selectedOffsetRange
  const rowStart = prevProps.rowStartOffset
  const rowEnd = rowStart + prevProps.bytesPerRow - 1

  // If both are null, no change
  if (!prevRange && !nextRange) {
    // console.log(`[rerenderRowIfSelectionChanged] Row ${rowStart}-${rowEnd}: Both ranges null, NO RERENDER`)
    return true
  }

  // If one is null and the other isn't, check if row intersects with selection
  if (!prevRange || !nextRange) {
    const range = prevRange || nextRange
    if (!range) {
      // console.log(`[rerenderRowIfSelectionChanged] Row ${rowStart}-${rowEnd}: Range is null, NO RERENDER`)
      return true
    }
    const minOffset = Math.min(range.start, range.end)
    const maxOffset = Math.max(range.start, range.end)
    const intersects = rowEnd >= minOffset && rowStart <= maxOffset
    const shouldRerender = !intersects
    // console.log(
    //   `[rerenderRowIfSelectionChanged] Row ${rowStart}-${rowEnd}: One range null, other=${JSON.stringify(range)}, intersects=${intersects}, ${shouldRerender ? "NO RERENDER" : "RERENDER"}`
    // )
    return shouldRerender
  }

  // Both ranges exist - check if they're different AND affect this row
  const prevMin = Math.min(prevRange.start, prevRange.end)
  const prevMax = Math.max(prevRange.start, prevRange.end)
  const nextMin = Math.min(nextRange.start, nextRange.end)
  const nextMax = Math.max(nextRange.start, nextRange.end)

  // If ranges are the same, no change
  if (prevMin === nextMin && prevMax === nextMax) {
    // console.log(
    //   `[rerenderRowIfSelectionChanged] Row ${rowStart}-${rowEnd}: Ranges identical ${JSON.stringify({ start: prevMin, end: prevMax })}, NO RERENDER`
    // )
    return true
  }
  
  // Check if row intersects with either range
  const intersectsPrev = rowEnd >= prevMin && rowStart <= prevMax
  const intersectsNext = rowEnd >= nextMin && rowStart <= nextMax
  const shouldRerender = intersectsPrev === intersectsNext

  // console.log(
  //   `[rerenderRowIfSelectionChanged] Row ${rowStart}-${rowEnd}: prevRange=${JSON.stringify({ start: prevMin, end: prevMax })}, nextRange=${JSON.stringify({ start: nextMin, end: nextMax })}, intersectsPrev=${intersectsPrev}, intersectsNext=${intersectsNext}, ${shouldRerender ? "NO RERENDER" : "RERENDER"}`
  // )

  // Only rerender if intersection status changed
  return shouldRerender
}
