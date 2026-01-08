import {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { FunctionComponent } from "react";
import { formatDataIntoRows } from "@hexed/binary-utils/formatter";
import { getDiffAtOffset } from "@hexed/binary-utils/differ";
import type { DiffResult } from "@hexed/types";
import { getDefaultColors } from "./utils/colors";
import {
  getRowFromY as getRowFromYUtil,
  getOffsetFromPosition as getOffsetFromPositionUtil,
  type LayoutMetrics,
} from "./utils/coordinates";
import { useSelection } from "./hooks/use-selection";
import { useKeyboardNavigation } from "./hooks/use-keyboard-navigation";
import { useOnClickOutside } from "usehooks-ts";
import { ScrollArea, ScrollBar } from "@hexed/ui";
export type SelectionRange = { start: number; end: number } | null;

export interface HexCanvasProps {
  data: Uint8Array;
  showAscii?: boolean;
  className?: string;
  diff?: DiffResult | null;
  highlightedOffset?: number | null;
  selectedOffset?: number | null;
  selectedOffsetRange?: SelectionRange;
  onSelectedOffsetChange?: (offset: number | null) => void;
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void;
  colors?: Partial<HexCanvasColors>;
}

export interface HexCanvasRef {
  scrollToOffset: (offset: number) => void;
}

export interface HexCanvasColors {
  background: string;
  addressText: string;
  byteText: string;
  asciiText: string;
  border: string;
  diffAdded: { bg: string; text: string };
  diffRemoved: { bg: string; text: string };
  diffModified: { bg: string; text: string };
  highlight: { bg: string; border: string };
  rowHover: string;
  byteHover: { bg: string; border: string };
  selection: { bg: string; border: string };
}

export const HexCanvas = forwardRef<HexCanvasRef, HexCanvasProps>(
  (
    {
      data,
      showAscii = true,
      className = "",
      diff = null,
      highlightedOffset: propHighlightedOffset = null,
      selectedOffset: propSelectedOffset,
      selectedOffsetRange: propSelectedOffsetRange,
      onSelectedOffsetChange,
      onSelectedOffsetRangeChange,
      colors: colorsProp,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [scrollTop, setScrollTop] = useState(0);
    const [themeChangeCounter, setThemeChangeCounter] = useState(0);
    const [internalHighlightedOffset, setInternalHighlightedOffset] = useState<
      number | null
    >(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [hoveredOffset, setHoveredOffset] = useState<number | null>(null);
    const [hasFocus, setHasFocus] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartOffset, setDragStartOffset] = useState<number | null>(null);
    const justFinishedDragRef = useRef(false);
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    // Use prop if provided, otherwise use internal state
    const highlightedOffset =
      propHighlightedOffset !== null
        ? propHighlightedOffset
        : internalHighlightedOffset;

    // Watch for theme changes (dark mode)
    useEffect(() => {
      const observer = new MutationObserver(() => {
        // Increment counter to trigger color recalculation
        setThemeChangeCounter((prev) => prev + 1);
      });

      // Observe the document element for class changes (dark mode)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => {
        observer.disconnect();
      };
    }, []);

    // Compute colors from props and CSS variables
    const colors = useMemo(() => {
      if (!containerRef.current) return {} as HexCanvasColors;
      const defaults = getDefaultColors(containerRef.current);

      return {
        ...defaults,
        ...colorsProp,
        diffAdded: { ...defaults.diffAdded, ...colorsProp?.diffAdded },
        diffRemoved: { ...defaults.diffRemoved, ...colorsProp?.diffRemoved },
        diffModified: { ...defaults.diffModified, ...colorsProp?.diffModified },
        highlight: { ...defaults.highlight, ...colorsProp?.highlight },
        byteHover: { ...defaults.byteHover, ...colorsProp?.byteHover },
        selection: { ...defaults.selection, ...colorsProp?.selection },
      };
    }, [colorsProp, dimensions.width, dimensions.height, themeChangeCounter]);

    // Calculate layout metrics based on canvas dimensions
    const layout = useMemo((): LayoutMetrics | null => {
      if (dimensions.width === 0 || dimensions.height === 0) return null;

      const canvas = canvasRef.current;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !canvas) return null;

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
      const hexByteGap = 12; // Space between hex bytes
      const borderWidth = 1;
      const addressPadding = 16;
      const hexPadding = 16;
      const asciiPadding = 16;
      const addressHexGap = 16; // Gap between address and hex columns
      const rowHeight = 20; // Fixed row height
      const verticalPadding = 16; // Vertical padding for top and bottom rows

      // Calculate available width for hex bytes
      // Total width - address column - gaps - padding
      const addressColumnTotalWidth = addressWidth + addressPadding * 2;
      let availableWidth =
        dimensions.width -
        addressColumnTotalWidth -
        addressHexGap -
        hexPadding * 2;

      // If showing ASCII, we need to account for it
      if (showAscii) {
        // Iteratively calculate bytesPerRow since ASCII width depends on it
        let estimatedBytes = Math.floor(
          (availableWidth + hexByteGap) / (hexByteWidth + hexByteGap)
        );

        // Refine estimate accounting for ASCII column
        for (let i = 0; i < 5; i++) {
          const asciiColumnWidth =
            estimatedBytes * asciiCharWidth + asciiPadding + borderWidth;
          const hexAvailableWidth = availableWidth - asciiColumnWidth;
          const newEstimatedBytes = Math.floor(
            (hexAvailableWidth + hexByteGap) / (hexByteWidth + hexByteGap)
          );

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
          bytesPerRow: Math.max(16, estimatedBytes),
          addressPadding,
          hexPadding,
          asciiPadding,
          verticalPadding,
        };
      } else {
        const calculatedBytes = Math.floor(
          (availableWidth + hexByteGap) / (hexByteWidth + hexByteGap)
        );

        return {
          rowHeight,
          addressColumnWidth: addressColumnTotalWidth,
          hexByteWidth,
          hexByteGap,
          asciiCharWidth,
          borderWidth,
          bytesPerRow: Math.max(16, calculatedBytes),
          addressPadding,
          hexPadding,
          asciiPadding,
          verticalPadding,
        };
      }
    }, [dimensions.width, dimensions.height, showAscii]);

    // Format data into rows
    const rows = useMemo(() => {
      if (!layout) return [];
      return formatDataIntoRows(data, layout.bytesPerRow);
    }, [data, layout]);

    // Calculate total canvas height (including vertical padding)
    const totalHeight = useMemo(() => {
      if (!layout) return 0;
      return (
        rows.length * layout.rowHeight +
        layout.verticalPadding * 2 -
        dimensions.height
      );
    }, [rows.length, layout, dimensions.height]);

    // Update canvas dimensions when container resizes
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const updateDimensions = () => {
        const rect = container.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      };

      // Initial dimensions
      updateDimensions();

      // Use ResizeObserver to track dimension changes
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Handle scroll
    const handleScroll = useCallback(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }, [handleScroll]);

    // Expose scrollToOffset via ref
    const scrollToOffset = useCallback(
      (offset: number) => {
        if (!layout || !containerRef.current) return;
        const rowIndex = Math.floor(offset / layout.bytesPerRow);
        const targetScrollTop =
          rowIndex * layout.rowHeight + layout.verticalPadding;
        containerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });

        // Set highlighted offset
        setInternalHighlightedOffset(offset);

        // Clear existing timeout
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }

        // Auto-clear highlight after 2 seconds
        highlightTimeoutRef.current = setTimeout(() => {
          setInternalHighlightedOffset(null);
          highlightTimeoutRef.current = null;
        }, 2000);
      },
      [layout]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      scrollToOffset,
    }));

    // Use selection hook
    const { selectedOffset, handleClick: handleSelectionClick } = useSelection({
      selectedOffset: propSelectedOffset,
      onSelectedOffsetChange,
    });

    // Determine the active selection range (prop takes precedence, fallback to single offset)
    const selectedRange: SelectionRange = useMemo(() => {
      if (propSelectedOffsetRange !== undefined) {
        return propSelectedOffsetRange;
      }
      if (selectedOffset !== null) {
        return { start: selectedOffset, end: selectedOffset };
      }
      return null;
    }, [propSelectedOffsetRange, selectedOffset]);

    // Helper to check if an offset is in the selection range
    const isOffsetInRange = useCallback(
      (offset: number, range: SelectionRange): boolean => {
        if (!range) return false;
        const min = Math.min(range.start, range.end);
        const max = Math.max(range.start, range.end);
        return offset >= min && offset <= max;
      },
      []
    );

    // Helper function to calculate row index from mouse Y coordinate
    const getRowFromY = useCallback(
      (mouseY: number): number | null => {
        if (!layout) return null;
        return getRowFromYUtil(mouseY, scrollTop, layout, rows.length);
      },
      [layout, scrollTop, rows.length]
    );

    // Helper function to calculate byte offset from mouse position
    const getOffsetFromPosition = useCallback(
      (mouseX: number, mouseY: number): number | null => {
        if (!layout) return null;
        return getOffsetFromPositionUtil(
          mouseX,
          mouseY,
          layout,
          rows,
          showAscii,
          getRowFromY
        );
      },
      [layout, rows, showAscii, getRowFromY]
    );

    // Extract the earliest byte from the range for keyboard navigation
    const keyboardSelectedOffset = useMemo(() => {
      if (selectedRange) {
        return Math.min(selectedRange.start, selectedRange.end);
      }
      return selectedOffset;
    }, [selectedRange, selectedOffset]);

    // Use keyboard navigation hook
    const { handleKeyDown } = useKeyboardNavigation({
      selectedOffset: keyboardSelectedOffset,
      dataLength: data.length,
      bytesPerRow: layout?.bytesPerRow ?? 16,
      viewportHeight: dimensions.height,
      rowHeight: layout?.rowHeight ?? 20,
      hasFocus,
      onOffsetChange: (offset: number) => {
        if (onSelectedOffsetRangeChange) {
          onSelectedOffsetRangeChange({ start: offset, end: offset });
        } else {
          handleSelectionClick(offset);
        }
      },
      onClearSelection: () => {
        if (onSelectedOffsetRangeChange) {
          onSelectedOffsetRangeChange(null);
        } else {
          handleSelectionClick(null);
        }
      },
      scrollToOffset,
    });

    // Handle mouse move to detect hover and drag
    const handleMouseMove = useCallback(
      (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!layout || !canvasRef.current) {
          setHoveredRow(null);
          setHoveredOffset(null);
          return;
        }

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        // Mouse coordinates are in CSS pixels (not device pixels)
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const rowIndex = getRowFromY(mouseY);
        const offset = getOffsetFromPosition(mouseX, mouseY);

        setHoveredRow(rowIndex);
        setHoveredOffset(offset);

        // Handle drag selection
        if (
          isDragging &&
          dragStartOffset !== null &&
          offset !== null &&
          onSelectedOffsetRangeChange
        ) {
          onSelectedOffsetRangeChange({ start: dragStartOffset, end: offset });
        }
      },
      [
        layout,
        getRowFromY,
        getOffsetFromPosition,
        isDragging,
        dragStartOffset,
        onSelectedOffsetRangeChange,
      ]
    );

    // Handle mouse leave to clear hover
    const handleMouseLeave = useCallback(() => {
      setHoveredRow(null);
      setHoveredOffset(null);
    }, []);

    // Handle mouse down to start drag selection
    const handleMouseDown = useCallback(
      (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!layout || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const offset = getOffsetFromPosition(mouseX, mouseY);
        if (offset !== null) {
          setIsDragging(true);
          setDragStartOffset(offset);
          if (onSelectedOffsetRangeChange) {
            onSelectedOffsetRangeChange({ start: offset, end: offset });
          } else {
            handleSelectionClick(offset);
          }
        }

        // Focus canvas for keyboard navigation
        canvas.focus();
      },
      [
        layout,
        getOffsetFromPosition,
        handleSelectionClick,
        onSelectedOffsetRangeChange,
      ]
    );

    // Handle mouse up to end drag selection
    const handleMouseUp = useCallback(() => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartOffset(null);
        // Mark that we just finished a drag to prevent click handler from interfering
        justFinishedDragRef.current = true;
        // Reset the flag after a short delay to allow click event to be ignored
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 0);
      }
    }, [isDragging]);

    // Add global mouseup handler to handle dragging outside canvas
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        if (isDragging) {
          setIsDragging(false);
          setDragStartOffset(null);
          // Mark that we just finished a drag to prevent click handler from interfering
          justFinishedDragRef.current = true;
          // Reset the flag after a short delay to allow click event to be ignored
          setTimeout(() => {
            justFinishedDragRef.current = false;
          }, 0);
        }
      };

      if (isDragging) {
        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => {
          window.removeEventListener("mouseup", handleGlobalMouseUp);
        };
      }
    }, [isDragging]);

    // Handle click to select byte (for single clicks without drag)
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLCanvasElement>) => {
        // Ignore click if we just finished a drag
        if (justFinishedDragRef.current) {
          return;
        }

        // Only handle click if we didn't drag
        if (!isDragging && dragStartOffset === null) {
          if (!layout || !canvasRef.current) return;

          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const mouseX = event.clientX - rect.left;
          const mouseY = event.clientY - rect.top;

          const offset = getOffsetFromPosition(mouseX, mouseY);
          if (onSelectedOffsetRangeChange) {
            onSelectedOffsetRangeChange(
              offset !== null ? { start: offset, end: offset } : null
            );
          } else {
            handleSelectionClick(offset);
          }
        }
      },
      [
        layout,
        getOffsetFromPosition,
        handleSelectionClick,
        isDragging,
        dragStartOffset,
        onSelectedOffsetRangeChange,
      ]
    );

    // Handle focus/blur for keyboard navigation
    const handleFocus = useCallback(() => {
      setHasFocus(true);
    }, []);

    const handleBlur = useCallback(() => {
      setHasFocus(false);
    }, []);

    // Handle click outside canvas to clear selection
    // useOnClickOutside(canvasRef as React.RefObject<HTMLElement>, () => {
    //   handleSelectionClick(null);
    // });

    // Render canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !layout || dimensions.height === 0) return;

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
      // ctx.font = MONOSPACE_FONT;
      ctx.font = `14px ${window
        .getComputedStyle(canvas)
        .getPropertyValue("--font-mono")}`;
      ctx.textBaseline = "middle";

      // Clear canvas with background color
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // If no rows, nothing to render
      if (rows.length === 0) return;

      // Calculate visible rows based on scroll position (accounting for vertical padding)
      const scrollTopAdjusted = Math.max(0, scrollTop - layout.verticalPadding);
      const startRow = Math.floor(scrollTopAdjusted / layout.rowHeight);
      const endRow = Math.min(
        rows.length - 1,
        Math.ceil((scrollTopAdjusted + dimensions.height) / layout.rowHeight)
      );

      // Render visible rows plus overscan
      const overscan = 5;
      const renderStartRow = Math.max(0, startRow - overscan);
      const renderEndRow = Math.min(rows.length - 1, endRow + overscan);

      // Calculate ASCII column X position
      const hexColumnStartX = layout.addressColumnWidth + 16; // Gap between address and hex
      const hexColumnEndX =
        hexColumnStartX +
        layout.bytesPerRow * (layout.hexByteWidth + layout.hexByteGap) -
        layout.hexByteGap;

      // Draw address/hex border line - full height, flush with canvas edges
      const addressHexBorderX = layout.addressColumnWidth;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = layout.borderWidth;
      ctx.beginPath();
      ctx.moveTo(addressHexBorderX, 0);
      ctx.lineTo(addressHexBorderX, displayHeight);
      ctx.stroke();

      // Draw ASCII border line once - full height, flush with canvas edges
      if (showAscii) {
        const asciiX = hexColumnEndX + layout.hexPadding;
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
        ctx.fillStyle = colors.addressText;
        ctx.fillText(
          row.address,
          layout.addressPadding,
          y + layout.rowHeight / 2 // Center vertically (textBaseline is "middle")
        );

        // Draw hex bytes with diff and highlight backgrounds
        let hexX = layout.addressColumnWidth + 16; // Gap between address and hex
        for (let j = 0; j < row.hexBytes.length; j++) {
          const offset = row.startOffset + j;
          const byteDiff = diff ? getDiffAtOffset(diff, offset) : null;
          const isHighlighted = highlightedOffset === offset;
          const isSelected = isOffsetInRange(offset, selectedRange);
          const isByteHovered = hoveredOffset === offset;

          // Draw diff background if present
          if (byteDiff) {
            const diffColor =
              byteDiff.type === "added"
                ? colors.diffAdded
                : byteDiff.type === "removed"
                ? colors.diffRemoved
                : colors.diffModified;
            ctx.fillStyle = diffColor.bg;
            ctx.fillRect(
              hexX - 2,
              y + 2,
              layout.hexByteWidth + 4,
              layout.rowHeight - 4
            );
          }

          // Draw highlight background if present
          if (isHighlighted) {
            ctx.fillStyle = colors.highlight.bg;
            ctx.fillRect(
              hexX - 2,
              y + 2,
              layout.hexByteWidth + 4,
              layout.rowHeight - 4
            );
          }

          // Draw selection background if present
          if (isSelected) {
            ctx.fillStyle = colors.selection.bg;
            ctx.fillRect(
              hexX - 2,
              y + 2,
              layout.hexByteWidth + 4,
              layout.rowHeight - 4
            );
          }

          // Draw byte hover background if present
          if (isByteHovered) {
            ctx.fillStyle = colors.byteHover.bg;
            ctx.fillRect(
              hexX - 2,
              y + 2,
              layout.hexByteWidth + 4,
              layout.rowHeight - 4
            );
          }

          // Draw highlight border if present
          if (isHighlighted) {
            ctx.strokeStyle = colors.highlight.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(
              hexX - 2,
              y + 2,
              layout.hexByteWidth + 4,
              layout.rowHeight - 4
            );
          }

          // Draw selection border if present
          if (isSelected) {
            ctx.strokeStyle = colors.selection.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              hexX - 2,
              y + 2,
              layout.hexByteWidth + 4,
              layout.rowHeight - 4
            );
          }

          // Draw byte hover border if present
          if (isByteHovered) {
            ctx.strokeStyle = colors.byteHover.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              hexX - 2,
              y + 2,
              layout.hexByteWidth + 4,
              layout.rowHeight - 4
            );
          }

          // Draw hex byte text
          if (byteDiff) {
            const diffColor =
              byteDiff.type === "added"
                ? colors.diffAdded
                : byteDiff.type === "removed"
                ? colors.diffRemoved
                : colors.diffModified;
            ctx.fillStyle = diffColor.text;
          } else {
            ctx.fillStyle = colors.byteText;
          }
          ctx.fillText(row.hexBytes[j], hexX, y + layout.rowHeight / 2);
          hexX += layout.hexByteWidth + layout.hexByteGap;
        }

        // Draw ASCII column if enabled
        if (showAscii) {
          const asciiX = hexColumnEndX + layout.hexPadding;

          // Draw ASCII characters with diff and highlight backgrounds
          const asciiStartX = asciiX + layout.borderWidth + layout.asciiPadding;
          for (let j = 0; j < row.ascii.length; j++) {
            const offset = row.startOffset + j;
            const byteDiff = diff ? getDiffAtOffset(diff, offset) : null;
            const isHighlighted = highlightedOffset === offset;
            const isSelected = isOffsetInRange(offset, selectedRange);
            const isByteHovered = hoveredOffset === offset;
            const charX = asciiStartX + j * layout.asciiCharWidth;

            // Draw diff background if present
            if (byteDiff) {
              const diffColor =
                byteDiff.type === "added"
                  ? colors.diffAdded
                  : byteDiff.type === "removed"
                  ? colors.diffRemoved
                  : colors.diffModified;
              ctx.fillStyle = diffColor.bg;
              ctx.fillRect(
                charX - 1,
                y + 2,
                layout.asciiCharWidth + 2,
                layout.rowHeight - 4
              );
            }

            // Draw highlight background if present
            if (isHighlighted) {
              ctx.fillStyle = colors.highlight.bg;
              ctx.fillRect(
                charX - 1,
                y + 2,
                layout.asciiCharWidth + 2,
                layout.rowHeight - 4
              );
            }

            // Draw selection background if present
            if (isSelected) {
              ctx.fillStyle = colors.selection.bg;
              ctx.fillRect(
                charX - 1,
                y + 2,
                layout.asciiCharWidth + 2,
                layout.rowHeight - 4
              );
            }

            // Draw byte hover background if present
            if (isByteHovered) {
              ctx.fillStyle = colors.byteHover.bg;
              ctx.fillRect(
                charX - 1,
                y + 2,
                layout.asciiCharWidth + 2,
                layout.rowHeight - 4
              );
            }

            // Draw highlight border if present
            if (isHighlighted) {
              ctx.strokeStyle = colors.highlight.border;
              ctx.lineWidth = 2;
              ctx.strokeRect(
                charX - 1,
                y + 2,
                layout.asciiCharWidth + 2,
                layout.rowHeight - 4
              );
            }

            // Draw selection border if present
            if (isSelected) {
              ctx.strokeStyle = colors.selection.border;
              ctx.lineWidth = 1;
              ctx.strokeRect(
                charX - 1,
                y + 2,
                layout.asciiCharWidth + 2,
                layout.rowHeight - 4
              );
            }

            // Draw byte hover border if present
            if (isByteHovered) {
              ctx.strokeStyle = colors.byteHover.border;
              ctx.lineWidth = 1;
              ctx.strokeRect(
                charX - 1,
                y + 2,
                layout.asciiCharWidth + 2,
                layout.rowHeight - 4
              );
            }

            // Draw ASCII character text
            if (byteDiff) {
              const diffColor =
                byteDiff.type === "added"
                  ? colors.diffAdded
                  : byteDiff.type === "removed"
                  ? colors.diffRemoved
                  : colors.diffModified;
              ctx.fillStyle = diffColor.text;
            } else {
              ctx.fillStyle = colors.asciiText;
            }
            ctx.fillText(row.ascii[j], charX, y + layout.rowHeight / 2);
          }
        }
      }
    }, [
      dimensions.width,
      dimensions.height,
      layout,
      rows,
      scrollTop,
      showAscii,
      colors,
      diff,
      highlightedOffset,
      selectedRange,
      isOffsetInRange,
      hoveredRow,
      hoveredOffset,
    ]);

    return (
      <div
        ref={containerRef}
        className={`h-full w-full overflow-auto ${className}`}
        style={{ position: "relative" }}
      >
        {/* Canvas stays fixed in viewport */}
        <canvas
          ref={canvasRef}
          className="font-mono"
          tabIndex={0}
          style={{
            display: "block",
            position: "sticky",
            top: 0,
            left: 0,
            zIndex: 1,
            outline: hasFocus ? "2px solid var(--ring)" : "none",
            userSelect: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {/* Spacer to make container scrollable to total height */}
        <div style={{ height: `${totalHeight}px`, width: "100%" }} />

        {/* <ScrollBar orientation="horizontal" /> */}
      </div>
    );
  }
);

HexCanvas.displayName = "HexCanvas";
