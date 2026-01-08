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

export interface HexCanvasProps {
  data: Uint8Array;
  showAscii?: boolean;
  className?: string;
  diff?: DiffResult | null;
  highlightedOffset?: number | null;
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
}

interface LayoutMetrics {
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

const MONOSPACE_FONT = "14px 'Courier New', 'Monaco', 'Consolas', monospace";

// Helper function to read CSS variables from DOM element
function getCSSVariable(element: HTMLElement, variable: string): string {
  return getComputedStyle(element).getPropertyValue(variable).trim();
}

// Helper function to add opacity to a color
// For oklch colors, we'll use CSS color-mix syntax which canvas supports
function addOpacity(color: string, opacity: number): string {
  // If color is already in rgba format, extract RGB and apply new opacity
  if (color.startsWith("rgba") || color.startsWith("rgb")) {
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const values = match[1].split(",").map((v) => v.trim());
      return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`;
    }
  }
  // For hex colors, convert to rgba
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // For oklch and other CSS colors, use color-mix (supported in modern browsers)
  // Fallback: append /opacity for oklch if browser supports it
  if (color.includes("oklch")) {
    // Try to extract oklch values and add opacity
    const match = color.match(/oklch\(([^)]+)\)/);
    if (match) {
      return `oklch(${match[1]} / ${opacity})`;
    }
  }
  // Fallback: return as-is (browser may handle it)
  return color;
}

// Create default colors from CSS variables
function getDefaultColors(container: HTMLElement): HexCanvasColors {
  const background = getCSSVariable(container, "--background");
  const foreground = getCSSVariable(container, "--foreground");
  const mutedForeground = getCSSVariable(container, "--muted-foreground");
  const border = getCSSVariable(container, "--border");
  const primary = getCSSVariable(container, "--primary");
  const ring = getCSSVariable(container, "--ring");
  const destructive = getCSSVariable(container, "--destructive");

  // Try to get chart colors for diff, fallback to defaults
  const chart1 =
    getCSSVariable(container, "--chart-1") || "oklch(0.646 0.222 41.116)";
  const chart4 =
    getCSSVariable(container, "--chart-4") || "oklch(0.828 0.189 84.429)";

  return {
    background: background || "oklch(1 0 0)",
    addressText: mutedForeground || foreground || "oklch(0.556 0 0)",
    byteText: foreground || "oklch(0.145 0 0)",
    asciiText: mutedForeground || foreground || "oklch(0.556 0 0)",
    border: border || "oklch(0.922 0 0)",
    diffAdded: {
      bg: addOpacity(chart1, 0.2),
      text: chart1,
    },
    diffRemoved: {
      bg: addOpacity(destructive || "oklch(0.577 0.245 27.325)", 0.2),
      text: destructive || "oklch(0.577 0.245 27.325)",
    },
    diffModified: {
      bg: addOpacity(chart4, 0.2),
      text: chart4,
    },
    highlight: {
      bg: addOpacity(primary || ring || "oklch(0.708 0 0)", 0.2),
      border: primary || ring || "oklch(0.708 0 0)",
    },
  };
}

export const HexCanvas = forwardRef<HexCanvasRef, HexCanvasProps>(
  (
    {
      data,
      showAscii = true,
      className = "",
      diff = null,
      highlightedOffset: propHighlightedOffset = null,
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
      return rows.length * layout.rowHeight + layout.verticalPadding * 2;
    }, [rows.length, layout]);

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
      ctx.textBaseline = "top";

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

        // Draw address
        ctx.fillStyle = colors.addressText;
        ctx.fillText(
          row.address,
          layout.addressPadding,
          y + (layout.rowHeight - 16) / 2 // Center vertically
        );

        // Draw hex bytes with diff and highlight backgrounds
        let hexX = layout.addressColumnWidth + 16; // Gap between address and hex
        for (let j = 0; j < row.hexBytes.length; j++) {
          const offset = row.startOffset + j;
          const byteDiff = diff ? getDiffAtOffset(diff, offset) : null;
          const isHighlighted = highlightedOffset === offset;

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
          ctx.fillText(row.hexBytes[j], hexX, y + (layout.rowHeight - 16) / 2);
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
            ctx.fillText(row.ascii[j], charX, y + (layout.rowHeight - 16) / 2);
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
          style={{
            display: "block",
            position: "sticky",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
        {/* Spacer to make container scrollable to total height */}
        <div style={{ height: `${totalHeight}px`, width: "100%" }} />
      </div>
    );
  }
);

HexCanvas.displayName = "HexCanvas";
