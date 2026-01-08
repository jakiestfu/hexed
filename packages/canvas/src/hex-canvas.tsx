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

export interface HexCanvasProps {
  data: Uint8Array;
  showAscii?: boolean;
  className?: string;
}

export interface HexCanvasRef {
  scrollToOffset: (offset: number) => void;
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
}

const MONOSPACE_FONT = "14px 'Courier New', 'Monaco', 'Consolas', monospace";
const BORDER_COLOR = "#e5e7eb"; // light grey
const TEXT_COLOR = "#000000";
const TEXT_COLOR_DARK = "#ffffff";

export const HexCanvas = forwardRef<HexCanvasRef, HexCanvasProps>(
  ({ data, showAscii = true, className = "" }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [scrollTop, setScrollTop] = useState(0);
    const [isDark, setIsDark] = useState(false);

    // Calculate layout metrics based on canvas dimensions
    const layout = useMemo((): LayoutMetrics | null => {
      if (dimensions.width === 0 || dimensions.height === 0) return null;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return null;

      // Set font for measurements
      ctx.font = MONOSPACE_FONT;

      // Measure text widths
      const addressText = "0x00000000";
      const hexByteText = "FF";
      const asciiText = "A";

      const addressWidth = ctx.measureText(addressText).width;
      const hexByteWidth = ctx.measureText(hexByteText).width;
      const asciiCharWidth = ctx.measureText(asciiText).width;

      // Constants
      const hexByteGap = 4; // Space between hex bytes
      const borderWidth = 1;
      const addressPadding = 16;
      const hexPadding = 16;
      const asciiPadding = 16;
      const addressHexGap = 16; // Gap between address and hex columns
      const rowHeight = 20; // Fixed row height

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
        };
      }
    }, [dimensions.width, dimensions.height, showAscii]);

    // Format data into rows
    const rows = useMemo(() => {
      if (!layout) return [];
      return formatDataIntoRows(data, layout.bytesPerRow);
    }, [data, layout]);

    // Calculate total canvas height
    const totalHeight = useMemo(() => {
      if (!layout) return 0;
      return rows.length * layout.rowHeight;
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

    // Detect dark mode
    useEffect(() => {
      const checkDarkMode = () => {
        if (containerRef.current) {
          const computedStyle = window.getComputedStyle(containerRef.current);
          const bgColor = computedStyle.backgroundColor;
          // Simple heuristic: if background is dark, use light text
          setIsDark(false); // Default to light mode, can be enhanced
        }
      };

      checkDarkMode();
      // Check periodically or on theme change
      const interval = setInterval(checkDarkMode, 1000);
      return () => clearInterval(interval);
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
        const targetScrollTop = rowIndex * layout.rowHeight;
        containerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      },
      [layout]
    );

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
      ctx.font = MONOSPACE_FONT;
      ctx.textBaseline = "top";

      // Set text color based on theme
      ctx.fillStyle = isDark ? TEXT_COLOR_DARK : TEXT_COLOR;

      // Clear canvas
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // If no rows, nothing to render
      if (rows.length === 0) return;

      // Calculate visible rows based on scroll position
      const startRow = Math.floor(scrollTop / layout.rowHeight);
      const endRow = Math.min(
        rows.length - 1,
        Math.ceil((scrollTop + dimensions.height) / layout.rowHeight)
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

      for (let i = renderStartRow; i <= renderEndRow; i++) {
        const row = rows[i];
        // Calculate y position relative to canvas viewport (accounting for scroll)
        const absoluteY = i * layout.rowHeight;
        const y = absoluteY - scrollTop; // Transform to canvas coordinates

        // Only render if row is visible in viewport
        if (y + layout.rowHeight < 0 || y > displayHeight) continue;

        // Draw address
        ctx.fillText(
          row.address,
          layout.addressPadding,
          y + (layout.rowHeight - 16) / 2 // Center vertically
        );

        // Draw hex bytes
        let hexX = layout.addressColumnWidth + 16; // Gap between address and hex
        for (let j = 0; j < row.hexBytes.length; j++) {
          ctx.fillText(row.hexBytes[j], hexX, y + (layout.rowHeight - 16) / 2);
          hexX += layout.hexByteWidth + layout.hexByteGap;
        }

        // Draw ASCII column if enabled
        if (showAscii) {
          const asciiX = hexColumnEndX + layout.hexPadding;

          // Draw border line
          ctx.strokeStyle = BORDER_COLOR;
          ctx.lineWidth = layout.borderWidth;
          ctx.beginPath();
          ctx.moveTo(asciiX, y);
          ctx.lineTo(asciiX, y + layout.rowHeight);
          ctx.stroke();

          // Draw ASCII characters
          const asciiStartX = asciiX + layout.borderWidth + layout.asciiPadding;
          for (let j = 0; j < row.ascii.length; j++) {
            ctx.fillText(
              row.ascii[j],
              asciiStartX + j * layout.asciiCharWidth,
              y + (layout.rowHeight - 16) / 2
            );
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
      isDark,
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
