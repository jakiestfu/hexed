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
import type { DiffResult } from "@hexed/types";
import { getDefaultColors } from "./utils/colors";
import {
  getRowFromY as getRowFromYUtil,
  getOffsetFromPosition as getOffsetFromPositionUtil,
  type LayoutMetrics,
} from "./utils/coordinates";
import {
  calculateLayout,
  calculateTotalHeight,
  calculateScrollPosition,
  isOffsetInRange,
  calculateSelectionRange,
  didDragOccur,
  drawHexCanvas,
  type SelectionRange,
} from "./utils/canvas";
import { useSelection } from "./hooks/use-selection";
import { useKeyboardNavigation } from "./hooks/use-keyboard-navigation";

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
    const shouldDeselectRef = useRef(false);
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

      return calculateLayout(ctx, canvas, dimensions, showAscii);
    }, [dimensions.width, dimensions.height, showAscii]);

    // Format data into rows
    const rows = useMemo(() => {
      if (!layout) return [];
      return formatDataIntoRows(data, layout.bytesPerRow);
    }, [data, layout]);

    // Calculate total canvas height (including vertical padding)
    const totalHeight = useMemo(() => {
      return calculateTotalHeight(rows.length, layout, dimensions.height);
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
        const targetScrollTop = calculateScrollPosition(
          offset,
          layout,
          dimensions.height
        );
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
      [layout, dimensions.height]
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
      return calculateSelectionRange(propSelectedOffsetRange, selectedOffset);
    }, [propSelectedOffsetRange, selectedOffset]);

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

    // Add global keyboard event listener
    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleKeyDown]);

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
          // Handle shift-click to extend selection
          if (event.shiftKey) {
            if (selectedRange !== null && onSelectedOffsetRangeChange) {
              // Extend selection: keep the start of the current selection as anchor,
              // extend the end to the clicked offset
              const anchor = selectedRange.start;
              onSelectedOffsetRangeChange({
                start: anchor,
                end: offset,
              });
            } else if (selectedOffset !== null && onSelectedOffsetRangeChange) {
              // Fallback: extend from current single selection
              // Use the selected offset as anchor
              onSelectedOffsetRangeChange({
                start: selectedOffset,
                end: offset,
              });
            } else if (onSelectedOffsetRangeChange) {
              // No existing selection, just select the clicked offset
              onSelectedOffsetRangeChange({ start: offset, end: offset });
            } else {
              // Fallback to single selection handler
              handleSelectionClick(offset);
            }
            // Don't start dragging on shift-click
            return;
          }

          // Check if clicking an already-selected single byte to deselect it
          const shouldDeselect =
            selectedRange !== null &&
            selectedRange.start === selectedRange.end &&
            isOffsetInRange(offset, selectedRange);

          shouldDeselectRef.current = shouldDeselect;

          setIsDragging(true);
          setDragStartOffset(offset);

          // Only set selection if we're not deselecting
          if (!shouldDeselect) {
            if (onSelectedOffsetRangeChange) {
              onSelectedOffsetRangeChange({ start: offset, end: offset });
            } else {
              handleSelectionClick(offset);
            }
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
        selectedRange,
        selectedOffset,
      ]
    );

    // Handle mouse up to end drag selection
    const handleMouseUp = useCallback(() => {
      if (isDragging) {
        // Check if we actually dragged (mouse moved) by comparing current selection
        // If selection range changed from initial single-byte selection, user dragged
        const dragOccurred = didDragOccur(dragStartOffset, selectedRange);

        setIsDragging(false);
        setDragStartOffset(null);

        // If we didn't drag and should deselect, deselect now
        if (!dragOccurred && shouldDeselectRef.current) {
          if (onSelectedOffsetRangeChange) {
            onSelectedOffsetRangeChange(null);
          } else {
            handleSelectionClick(null);
          }
          shouldDeselectRef.current = false;
        }

        // Mark that we just finished a drag to prevent click handler from interfering
        justFinishedDragRef.current = true;
        // Reset the flag after a short delay to allow click event to be ignored
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 0);
      }
    }, [
      isDragging,
      dragStartOffset,
      selectedRange,
      onSelectedOffsetRangeChange,
      handleSelectionClick,
    ]);

    // Add global mouseup handler to handle dragging outside canvas
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        if (isDragging) {
          // Check if we actually dragged (mouse moved) by comparing current selection
          const dragOccurred = didDragOccur(dragStartOffset, selectedRange);

          setIsDragging(false);
          setDragStartOffset(null);

          // If we didn't drag and should deselect, deselect now
          if (!dragOccurred && shouldDeselectRef.current) {
            if (onSelectedOffsetRangeChange) {
              onSelectedOffsetRangeChange(null);
            } else {
              handleSelectionClick(null);
            }
            shouldDeselectRef.current = false;
          }

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
    }, [
      isDragging,
      dragStartOffset,
      selectedRange,
      onSelectedOffsetRangeChange,
      handleSelectionClick,
    ]);

    // Handle click outside canvas to clear selection
    // useOnClickOutside(canvasRef as React.RefObject<HTMLElement>, () => {
    //   handleSelectionClick(null);
    // });

    // Render canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !layout || dimensions.height === 0) return;

      drawHexCanvas(
        canvas,
        ctx,
        layout,
        dimensions,
        rows,
        scrollTop,
        showAscii,
        colors,
        diff,
        highlightedOffset,
        selectedRange,
        hoveredRow,
        hoveredOffset
      );
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
            userSelect: "none",
            outline: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {/* Spacer to make container scrollable to total height */}
        <div style={{ height: `${totalHeight}px`, width: "100%" }} />
      </div>
    );
  }
);

HexCanvas.displayName = "HexCanvas";
