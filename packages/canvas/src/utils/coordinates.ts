import type { FormattedRow } from "@hexed/binary-utils/formatter";
import { getAsciiStartX } from "./canvas";

export interface LayoutMetrics {
  rowHeight: number;
  addressColumnWidth: number;
  hexByteWidth: number;
  hexByteGap: number;
  asciiCharWidth: number;
  asciiCellWidth: number;
  borderWidth: number;
  bytesPerRow: number;
  addressPadding: number;
  cellWidth: number;
  hexAsciiGap: number;
  asciiPadding: number;
  verticalPadding: number;
}

// Helper function to get cell bounds for rendering and interaction
export function getCellBounds(
  cellX: number,
  rowY: number,
  cellWidth: number,
  rowHeight: number,
  horizontalPadding: number = 0,
  verticalPadding: number = 0
): { x: number; y: number; width: number; height: number } {
  return {
    x: cellX - horizontalPadding,
    y: rowY + verticalPadding,
    width: cellWidth + horizontalPadding * 2,
    height: rowHeight - verticalPadding * 2,
  };
}

// Helper function to calculate row index from mouse Y coordinate
export function getRowFromY(
  mouseY: number,
  scrollTop: number,
  layout: LayoutMetrics,
  rowsLength: number
): number | null {
  // Account for scroll position and vertical padding
  const absoluteY = mouseY + scrollTop - layout.verticalPadding;
  const rowIndex = Math.floor(absoluteY / layout.rowHeight);
  if (rowIndex < 0 || rowIndex >= rowsLength) return null;
  return rowIndex;
}

// Helper function to calculate byte offset from mouse position
export function getOffsetFromPosition(
  mouseX: number,
  mouseY: number,
  layout: LayoutMetrics,
  rows: FormattedRow[],
  showAscii: boolean,
  getRowFromY: (y: number) => number | null,
  totalSize?: number
): number | null {
  const rowIndex = getRowFromY(mouseY);
  if (rowIndex === null) return null;

  // Calculate virtual row's start offset from rowIndex
  const virtualRowStartOffset = rowIndex * layout.bytesPerRow;
  
  // Check if this offset is within bounds
  if (totalSize !== undefined && virtualRowStartOffset >= totalSize) {
    return null;
  }

  // Calculate hex column start position (matches rendering: layout.addressColumnWidth + 16)
  const hexColumnStartX = layout.addressColumnWidth + 16;

  // Check each hex byte individually to see if mouse is within its bounds
  // This matches the rendering: hexX starts at hexColumnStartX and increments by cellWidth
  for (let j = 0; j < layout.bytesPerRow; j++) {
    const offset = virtualRowStartOffset + j;
    
    // Skip if outside totalSize bounds
    if (totalSize !== undefined && offset >= totalSize) break;

    const hexX = hexColumnStartX + j * layout.cellWidth;
    // Use getCellBounds to match rendering exactly
    const bounds = getCellBounds(
      hexX,
      0, // rowY not needed for horizontal bounds check
      layout.cellWidth,
      layout.rowHeight
    );

    if (mouseX >= bounds.x && mouseX < bounds.x + bounds.width) {
      return offset;
    }
  }

  // Check if mouse is in ASCII column
  if (showAscii) {
    // Use the same helper function as rendering to ensure consistent positioning
    const asciiStartX = getAsciiStartX(layout);

    // Check each ASCII character individually
    for (let j = 0; j < layout.bytesPerRow; j++) {
      const offset = virtualRowStartOffset + j;
      
      // Skip if outside totalSize bounds
      if (totalSize !== undefined && offset >= totalSize) break;

      const charX = asciiStartX + j * layout.asciiCellWidth;
      // Use getCellBounds to match rendering exactly
      const bounds = getCellBounds(
        charX,
        0, // rowY not needed for horizontal bounds check
        layout.asciiCellWidth,
        layout.rowHeight,
        1
      );

      if (mouseX >= bounds.x && mouseX < bounds.x + bounds.width) {
        return offset;
      }
    }
  }

  return null;
}
