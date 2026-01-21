export const highlight = "bg-chart-4/30 dark:bg-chart-4/20"
export const highlightClasses = highlight.split(" ")

// Helper functions for DOM-based selection updates during drag
export const updateSelectionStyles = (
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
export const updateAllRowsSelection = (
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
