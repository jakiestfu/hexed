import type { FormattedRow } from "@hexed/binary-utils/formatter";

export interface LayoutMetrics {
  rowHeight: number;
  addressColumnWidth: number;
  hexByteWidth: number;
  hexByteGap: number;
  asciiCharWidth: number;
  borderWidth: number;
  bytesPerRow: number;
  addressPadding: number;
  hexPadding: number;
  asciiPadding: number;
  verticalPadding: number;
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
  getRowFromY: (y: number) => number | null
): number | null {
  const rowIndex = getRowFromY(mouseY);
  if (rowIndex === null) return null;

  const row = rows[rowIndex];
  if (!row) return null;

  // Calculate hex column start position (matches rendering: layout.addressColumnWidth + 16)
  const hexColumnStartX = layout.addressColumnWidth + 16;

  // Check each hex byte individually to see if mouse is within its bounds
  // This matches the rendering: hexX starts at hexColumnStartX and increments by (hexByteWidth + hexByteGap)
  for (let j = 0; j < row.hexBytes.length; j++) {
    const hexX =
      hexColumnStartX + j * (layout.hexByteWidth + layout.hexByteGap);
    // Byte bounds match rendering: hexX - 2 to hexX + hexByteWidth + 2
    const byteStartX = hexX - 2;
    const byteEndX = hexX + layout.hexByteWidth + 2;

    if (mouseX >= byteStartX && mouseX < byteEndX) {
      return row.startOffset + j;
    }
  }

  // Check if mouse is in ASCII column
  if (showAscii) {
    const hexColumnEndX =
      hexColumnStartX +
      row.hexBytes.length * (layout.hexByteWidth + layout.hexByteGap);
    const asciiX =
      hexColumnEndX +
      layout.hexPadding +
      layout.borderWidth +
      layout.asciiPadding;

    // Check each ASCII character individually
    for (let j = 0; j < row.ascii.length; j++) {
      const charX = asciiX + j * layout.asciiCharWidth;
      // Character bounds match rendering: charX - 1 to charX + asciiCharWidth + 1
      const charStartX = charX - 1;
      const charEndX = charX + layout.asciiCharWidth + 1;

      if (mouseX >= charStartX && mouseX < charEndX) {
        return row.startOffset + j;
      }
    }
  }

  return null;
}
