import { useCallback } from "react";

interface UseKeyboardNavigationParams {
  selectedOffset: number | null;
  dataLength: number;
  bytesPerRow: number;
  viewportHeight: number;
  rowHeight: number;
  onOffsetChange: (offset: number) => void;
  onClearSelection: () => void;
  scrollToOffset: (offset: number) => void;
}

interface UseKeyboardNavigationReturn {
  handleKeyDown: (event: KeyboardEvent | React.KeyboardEvent) => void;
}

/**
 * Hook for handling keyboard navigation in hex canvas
 * Supports arrow keys, Home/End, and Page Up/Down with wrapping
 */
export function useKeyboardNavigation({
  selectedOffset,
  dataLength,
  bytesPerRow,
  viewportHeight,
  rowHeight,
  onOffsetChange,
  onClearSelection,
  scrollToOffset,
}: UseKeyboardNavigationParams): UseKeyboardNavigationReturn {
  const clampOffset = useCallback(
    (offset: number): number => {
      return Math.max(0, Math.min(dataLength - 1, offset));
    },
    [dataLength]
  );

  const wrapUp = useCallback(
    (offset: number): number => {
      if (offset < 0) {
        // Wrap to last row, same column position
        const column = offset % bytesPerRow;
        const lastRowStart =
          Math.floor((dataLength - 1) / bytesPerRow) * bytesPerRow;
        return clampOffset(lastRowStart + column);
      }
      return clampOffset(offset);
    },
    [bytesPerRow, dataLength, clampOffset]
  );

  const wrapDown = useCallback(
    (offset: number): number => {
      if (offset >= dataLength) {
        // Wrap to first row, same column position
        const column = offset % bytesPerRow;
        return clampOffset(column);
      }
      return clampOffset(offset);
    },
    [dataLength, bytesPerRow, clampOffset]
  );

  const wrapLeft = useCallback(
    (offset: number): number => {
      const currentRow = Math.floor(offset / bytesPerRow);
      const column = offset % bytesPerRow;

      if (column === 0) {
        // At start of row, wrap to last byte of previous row
        if (currentRow === 0) {
          // Already at first row, wrap to last row
          const lastRowStart =
            Math.floor((dataLength - 1) / bytesPerRow) * bytesPerRow;
          const lastRowLength = dataLength - lastRowStart;
          return clampOffset(lastRowStart + lastRowLength - 1);
        }
        return clampOffset((currentRow - 1) * bytesPerRow + bytesPerRow - 1);
      }
      return clampOffset(offset - 1);
    },
    [bytesPerRow, dataLength, clampOffset]
  );

  const wrapRight = useCallback(
    (offset: number): number => {
      const currentRow = Math.floor(offset / bytesPerRow);
      const column = offset % bytesPerRow;
      const rowStart = currentRow * bytesPerRow;
      const rowEnd = Math.min(dataLength - 1, rowStart + bytesPerRow - 1);

      if (offset >= rowEnd) {
        // At end of row, wrap to first byte of next row
        if (currentRow >= Math.floor((dataLength - 1) / bytesPerRow)) {
          // Already at last row, wrap to first row
          return clampOffset(0);
        }
        return clampOffset((currentRow + 1) * bytesPerRow);
      }
      return clampOffset(offset + 1);
    },
    [bytesPerRow, dataLength, clampOffset]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent | React.KeyboardEvent) => {
      // Ignore keyboard events when user is typing in input, textarea, or contenteditable elements
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      // Handle Escape key to clear selection (works even when selectedOffset is null)
      if (event.key === "Escape") {
        event.preventDefault();
        onClearSelection();
        return;
      }

      // Other keys require a selection
      if (selectedOffset === null) return;

      let newOffset: number | null = null;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          newOffset = wrapUp(selectedOffset - bytesPerRow);
          break;
        case "ArrowDown":
          event.preventDefault();
          newOffset = wrapDown(selectedOffset + bytesPerRow);
          break;
        case "ArrowLeft":
          event.preventDefault();
          newOffset = wrapLeft(selectedOffset);
          break;
        case "ArrowRight":
          event.preventDefault();
          newOffset = wrapRight(selectedOffset);
          break;
        case "Home":
          event.preventDefault();
          // Move to first byte of the file
          newOffset = clampOffset(0);
          break;
        case "End":
          event.preventDefault();
          // Move to last byte of the file
          newOffset = clampOffset(dataLength - 1);
          break;
        case "PageUp":
          event.preventDefault();
          // Move up by viewport height
          const rowsPerPage = Math.floor(viewportHeight / rowHeight);
          newOffset = wrapUp(selectedOffset - rowsPerPage * bytesPerRow);
          break;
        case "PageDown":
          event.preventDefault();
          // Move down by viewport height
          const rowsPerPageDown = Math.floor(viewportHeight / rowHeight);
          newOffset = wrapDown(selectedOffset + rowsPerPageDown * bytesPerRow);
          break;
        default:
          return;
      }

      if (newOffset !== null && newOffset !== selectedOffset) {
        onOffsetChange(newOffset);
        scrollToOffset(newOffset);
      }
    },
    [
      selectedOffset,
      bytesPerRow,
      dataLength,
      viewportHeight,
      rowHeight,
      wrapUp,
      wrapDown,
      wrapLeft,
      wrapRight,
      clampOffset,
      onOffsetChange,
      onClearSelection,
      scrollToOffset,
    ]
  );

  return {
    handleKeyDown,
  };
}
