import { getDiffAtOffset } from "@hexed/binary-utils/differ";
import type { DiffResult } from "@hexed/types";
import type { FormattedRow } from "@hexed/binary-utils/formatter";
import { getCellBounds, type LayoutMetrics } from "./coordinates";
import type { HexCanvasColors } from "../hex-canvas";

export type SelectionRange = { start: number; end: number } | null;

/**
 * Minimum number of bytes per row in the hex canvas.
 * Set to 1 to allow full responsiveness down to 1 byte per row.
 */
const MIN_BYTES_PER_ROW = 1;

/**
 * Calculate layout metrics based on canvas dimensions and context
 */
export function calculateLayout(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  dimensions: { width: number; height: number },
  showAscii: boolean
): LayoutMetrics | null {
  if (dimensions.width === 0 || dimensions.height === 0) return null;

  const computedStyle = window.getComputedStyle(canvas);

  // Set font for measurements
  ctx.font = `14px ${computedStyle.getPropertyValue("--font-mono")}`;

  // Measure text widths
  const addressText = "0x00000000";
  const hexByteText = "FF";
  const asciiText = "A";

  const addressWidth = ctx.measureText(addressText).width;
  const hexByteWidth = ctx.measureText(hexByteText).width;
  const asciiCharWidth = ctx.measureText(asciiText).width;

  // Constants
  const hexByteGap = 0; // Space between hex bytes
  const borderWidth = 1;
  const addressPadding = 16;
  const cellWidth = 30; // Fixed width of each hex cell
  const rowHeight = 24; // Fixed row height
  const asciiPadding = 16;
  const addressHexGap = 16; // Gap between address and hex columns
  const hexAsciiGap = 16; // Gap between hex and ASCII columns
  const verticalPadding = 16; // Vertical padding for top and bottom rows

  // Calculate available width for hex bytes
  // Total width - address column - gaps - minimal padding
  const addressColumnTotalWidth = addressWidth + addressPadding * 2;
  let availableWidth =
    dimensions.width - addressColumnTotalWidth - addressHexGap;

  // If showing ASCII, we need to account for it
  if (showAscii) {
    // Iteratively calculate bytesPerRow since ASCII width depends on it
    // Account for hex-to-ASCII gap
    const hexAvailableWidth = availableWidth - hexAsciiGap;
    let estimatedBytes = Math.floor(hexAvailableWidth / cellWidth);

    // Refine estimate accounting for ASCII column
    for (let i = 0; i < 5; i++) {
      const asciiColumnWidth =
        estimatedBytes * asciiCharWidth + asciiPadding * 2 + borderWidth;
      const remainingWidth =
        availableWidth - hexAsciiGap - asciiColumnWidth;
      const newEstimatedBytes = Math.floor(remainingWidth / cellWidth);

      if (newEstimatedBytes === estimatedBytes) {
        break;
      }
      estimatedBytes = newEstimatedBytes;
    }

    return {
      rowHeight,
      addressColumnWidth: addressColumnTotalWidth,
      hexByteWidth,
      hexByteGap,
      asciiCharWidth,
      borderWidth,
      bytesPerRow: Math.max(MIN_BYTES_PER_ROW, estimatedBytes),
      addressPadding,
      cellWidth,
      hexAsciiGap,
      asciiPadding,
      verticalPadding,
    };
  } else {
    const calculatedBytes = Math.floor(availableWidth / cellWidth);

    return {
      rowHeight,
      addressColumnWidth: addressColumnTotalWidth,
      hexByteWidth,
      hexByteGap,
      asciiCharWidth,
      borderWidth,
      bytesPerRow: Math.max(MIN_BYTES_PER_ROW, calculatedBytes),
      addressPadding,
      cellWidth,
      hexAsciiGap,
      asciiPadding,
      verticalPadding,
    };
  }
}

/**
 * Calculate total canvas scroll height
 */
export function calculateTotalHeight(
  rowsLength: number,
  layout: LayoutMetrics | null,
  viewportHeight: number
): number {
  if (!layout) return 0;
  return (
    rowsLength * layout.rowHeight +
    layout.verticalPadding * 2 -
    viewportHeight
  );
}

/**
 * Calculate which rows should be rendered based on scroll position
 */
export function calculateVisibleRows(
  scrollTop: number,
  layout: LayoutMetrics,
  viewportHeight: number,
  rowsLength: number,
  overscan: number = 5
): { startRow: number; endRow: number; renderStartRow: number; renderEndRow: number } {
  // Calculate visible rows based on scroll position (accounting for vertical padding)
  const scrollTopAdjusted = Math.max(0, scrollTop - layout.verticalPadding);
  const startRow = Math.floor(scrollTopAdjusted / layout.rowHeight);
  const endRow = Math.min(
    rowsLength - 1,
    Math.ceil((scrollTopAdjusted + viewportHeight) / layout.rowHeight)
  );

  // Render visible rows plus overscan
  const renderStartRow = Math.max(0, startRow - overscan);
  const renderEndRow = Math.min(rowsLength - 1, endRow + overscan);

  return { startRow, endRow, renderStartRow, renderEndRow };
}

/**
 * Calculate target scroll position to center an offset in the viewport
 */
export function calculateScrollPosition(
  offset: number,
  layout: LayoutMetrics,
  viewportHeight: number
): number {
  const rowIndex = Math.floor(offset / layout.bytesPerRow);
  // Calculate row's top position
  const rowTop = rowIndex * layout.rowHeight + layout.verticalPadding;
  // Center the row in the viewport
  const targetScrollTop =
    rowTop + layout.rowHeight / 2 - viewportHeight / 2;
  return Math.max(0, targetScrollTop); // Ensure we don't scroll to negative values
}

/**
 * Check if an offset is within a selection range
 */
export function isOffsetInRange(
  offset: number,
  range: SelectionRange
): boolean {
  if (!range) return false;
  const min = Math.min(range.start, range.end);
  const max = Math.max(range.start, range.end);
  return offset >= min && offset <= max;
}

/**
 * Calculate the active selection range from props and state
 */
export function calculateSelectionRange(
  propSelectedOffsetRange: SelectionRange | undefined,
  selectedOffset: number | null
): SelectionRange {
  if (propSelectedOffsetRange !== undefined) {
    return propSelectedOffsetRange;
  }
  if (selectedOffset !== null) {
    return { start: selectedOffset, end: selectedOffset };
  }
  return null;
}

/**
 * Determine if a drag actually occurred by comparing initial and current selection
 */
export function didDragOccur(
  dragStartOffset: number | null,
  selectedRange: SelectionRange
): boolean {
  if (dragStartOffset === null || selectedRange === null) return false;
  return (
    selectedRange.start !== dragStartOffset ||
    selectedRange.end !== dragStartOffset
  );
}

/**
 * Get diff color based on diff type
 */
export function getDiffColor(
  diffType: "added" | "removed" | "modified",
  colors: HexCanvasColors
): { bg: string; text: string } {
  switch (diffType) {
    case "added":
      return colors.diffAdded;
    case "removed":
      return colors.diffRemoved;
    case "modified":
      return colors.diffModified;
  }
}

/**
 * Get cell fill and stroke styles based on state
 */
export function getCellStyles(
  byteDiff: ReturnType<typeof getDiffAtOffset> | null,
  isHighlighted: boolean,
  isSelected: boolean,
  isByteHovered: boolean,
  colors: HexCanvasColors
): {
  fillStyle: string | null;
  strokeStyle: string | null;
  strokeWidth: number;
} {
  let fillStyle: string | null = null;
  let strokeStyle: string | null = null;
  let strokeWidth = 0;

  // Determine fill style (priority: diff > highlight > selection > hover)
  if (byteDiff) {
    const diffColor = getDiffColor(byteDiff.type, colors);
    fillStyle = diffColor.bg;
  } else if (isHighlighted) {
    fillStyle = colors.selection.bg;
  } else if (isSelected) {
    fillStyle = colors.selection.bg;
  } else if (isByteHovered) {
    fillStyle = colors.byteHover.bg;
  }

  // Determine stroke style (priority: highlight > selection > hover)
  // Currently disabled - stroke is transparent
  strokeStyle = "transparent";

  return { fillStyle, strokeStyle, strokeWidth };
}

/**
 * Calculate hex column start X position
 */
export function getHexColumnStartX(layout: LayoutMetrics): number {
  return layout.addressColumnWidth + 16; // Gap between address and hex
}

/**
 * Calculate hex column end X position
 */
export function getHexColumnEndX(layout: LayoutMetrics): number {
  const hexColumnStartX = getHexColumnStartX(layout);
  return hexColumnStartX + layout.bytesPerRow * layout.cellWidth;
}

/**
 * Calculate ASCII column X position
 */
export function getAsciiColumnX(layout: LayoutMetrics): number {
  const hexColumnEndX = getHexColumnEndX(layout);
  return hexColumnEndX + layout.hexAsciiGap;
}

/**
 * Calculate ASCII start X position (after border and padding)
 */
export function getAsciiStartX(layout: LayoutMetrics): number {
  const asciiX = getAsciiColumnX(layout);
  return asciiX + layout.borderWidth + layout.asciiPadding;
}

/**
 * Calculate address/hex border X position
 */
export function getAddressHexBorderX(layout: LayoutMetrics): number {
  return layout.addressColumnWidth;
}

/**
 * Draw the hex canvas with all rows, borders, and styling
 */
export function drawHexCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  layout: LayoutMetrics,
  dimensions: { width: number; height: number },
  rows: FormattedRow[],
  scrollTop: number,
  showAscii: boolean,
  colors: HexCanvasColors,
  diff: DiffResult | null,
  highlightedOffset: number | null,
  selectedRange: SelectionRange,
  hoveredRow: number | null,
  hoveredOffset: number | null
): void {
  // Handle high DPI displays
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = dimensions.width;
  const displayHeight = dimensions.height; // Use viewport height, not total height

  // Set actual canvas size in memory (scaled by device pixel ratio)
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  // Scale the context to account for device pixel ratio
  ctx.scale(dpr, dpr);

  // Set CSS size to maintain correct display size
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  // Set font
  ctx.font = `14px ${window
    .getComputedStyle(canvas)
    .getPropertyValue("--font-mono")}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // Clear canvas with background color
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // If no rows, nothing to render
  if (rows.length === 0) return;

  // Calculate visible rows based on scroll position (accounting for vertical padding)
  const { renderStartRow, renderEndRow } = calculateVisibleRows(
    scrollTop,
    layout,
    dimensions.height,
    rows.length
  );

  // Calculate column positions
  const hexColumnStartX = getHexColumnStartX(layout);
  const hexColumnEndX = getHexColumnEndX(layout);
  const addressHexBorderX = getAddressHexBorderX(layout);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = layout.borderWidth;
  ctx.beginPath();
  ctx.moveTo(addressHexBorderX, 0);
  ctx.lineTo(addressHexBorderX, displayHeight);
  ctx.stroke();

  // Draw ASCII border line once - full height, flush with canvas edges
  if (showAscii) {
    const asciiX = getAsciiColumnX(layout);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = layout.borderWidth;
    ctx.beginPath();
    ctx.moveTo(asciiX, 0);
    ctx.lineTo(asciiX, displayHeight);
    ctx.stroke();
  }

  for (let i = renderStartRow; i <= renderEndRow; i++) {
    const row = rows[i];
    // Calculate y position relative to canvas viewport (accounting for scroll and vertical padding)
    const absoluteY = i * layout.rowHeight + layout.verticalPadding;
    const y = absoluteY - scrollTop; // Transform to canvas coordinates

    // Only render if row is visible in viewport
    if (y + layout.rowHeight < 0 || y > displayHeight) continue;

    // Draw row hover background if row is hovered
    const isRowHovered = hoveredRow === i;
    if (isRowHovered) {
      ctx.fillStyle = colors.rowHover;
      ctx.fillRect(0, y, displayWidth, layout.rowHeight);
    }

    // Draw address
    ctx.textAlign = "left"; // Address is left-aligned
    ctx.fillStyle = colors.addressText;
    ctx.fillText(
      row.address,
      layout.addressPadding,
      y + layout.rowHeight / 2 // Center vertically (textBaseline is "middle")
    );

    // Draw hex bytes with diff and highlight backgrounds
    let hexX = hexColumnStartX;
    for (let j = 0; j < row.hexBytes.length; j++) {
      const offset = row.startOffset + j;
      const byteDiff = diff ? getDiffAtOffset(diff, offset) : null;
      const isHighlighted = highlightedOffset === offset;
      const isSelected = isOffsetInRange(offset, selectedRange);
      const isByteHovered = hoveredOffset === offset;

      // Get cell bounds for this hex byte
      const hexBounds = getCellBounds(
        hexX,
        y,
        layout.cellWidth,
        layout.rowHeight
      );

      // Get cell styles and draw
      const styles = getCellStyles(
        byteDiff,
        isHighlighted,
        isSelected,
        isByteHovered,
        colors
      );

      if (styles.fillStyle) {
        ctx.fillStyle = styles.fillStyle;
        ctx.fillRect(
          hexBounds.x,
          hexBounds.y,
          hexBounds.width,
          hexBounds.height
        );
      }

      if (styles.strokeStyle) {
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.strokeWidth;
        ctx.strokeRect(
          hexBounds.x,
          hexBounds.y,
          hexBounds.width,
          hexBounds.height
        );
      }

      // Draw hex byte text (centered in cell)
      ctx.textAlign = "center"; // Center hex bytes in their cells
      const textX = hexX + layout.cellWidth / 2;
      if (byteDiff) {
        const diffColor = getDiffColor(byteDiff.type, colors);
        ctx.fillStyle = diffColor.text;
      } else {
        ctx.fillStyle = colors.byteText;
      }
      ctx.fillText(row.hexBytes[j], textX, y + layout.rowHeight / 2);
      hexX += layout.cellWidth;
    }

    // Draw ASCII column if enabled
    if (showAscii) {
      // Draw ASCII characters with diff and highlight backgrounds
      const asciiStartX = getAsciiStartX(layout);
      for (let j = 0; j < row.ascii.length; j++) {
        const offset = row.startOffset + j;
        const byteDiff = diff ? getDiffAtOffset(diff, offset) : null;
        const isHighlighted = highlightedOffset === offset;
        const isSelected = isOffsetInRange(offset, selectedRange);
        const isByteHovered = hoveredOffset === offset;
        const charX = asciiStartX + j * layout.asciiCharWidth;

        // Get cell bounds for this ASCII character
        const asciiBounds = getCellBounds(
          charX,
          y,
          layout.asciiCharWidth,
          layout.rowHeight,
          1
        );

        // Get cell styles and draw
        const styles = getCellStyles(
          byteDiff,
          isHighlighted,
          isSelected,
          isByteHovered,
          colors
        );

        if (styles.fillStyle) {
          ctx.fillStyle = styles.fillStyle;
          ctx.fillRect(
            asciiBounds.x,
            asciiBounds.y,
            asciiBounds.width,
            asciiBounds.height
          );
        }

        if (styles.strokeStyle) {
          ctx.strokeStyle = styles.strokeStyle;
          ctx.lineWidth = styles.strokeWidth;
          ctx.strokeRect(
            asciiBounds.x,
            asciiBounds.y,
            asciiBounds.width,
            asciiBounds.height
          );
        }

        // Draw ASCII character text
        ctx.textAlign = "left"; // ASCII characters are left-aligned
        if (byteDiff) {
          const diffColor = getDiffColor(byteDiff.type, colors);
          ctx.fillStyle = diffColor.text;
        } else {
          ctx.fillStyle = colors.asciiText;
        }
        ctx.fillText(row.ascii[j], charX, y + layout.rowHeight / 2);
      }
    }
  }
}
