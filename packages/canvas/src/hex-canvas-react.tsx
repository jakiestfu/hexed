import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import type { RefObject } from "react"

import type { DiffResult } from "@hexed/types"

import { HexCanvas, type HexCanvasOptions } from "./hex-canvas"
import type { HexCanvasColors } from "./utils/colors"
import type { SelectionRange } from "./utils/canvas"

export interface HexCanvasReactProps {
  file: File | null
  showAscii?: boolean
  colors?: Partial<HexCanvasColors>
  diff?: DiffResult | null
  windowSize?: number
  className?: string
  selectedOffsetRange?: SelectionRange
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
  onScroll?: (scrollTop: number) => void
  onOffsetHighlight?: (offset: number | null) => void
  onByteClick?: (offset: number) => void
  onByteSelect?: (offset: number | null) => void
}

export interface HexCanvasReactRef {
  scrollToOffset: (offset: number) => void
  getSelectedRange: () => SelectionRange
  getScrollTop: () => number
  setSelectedRange: (range: SelectionRange) => void
}

export const HexCanvasReact = forwardRef<HexCanvasReactRef, HexCanvasReactProps>(
  (
    {
      file,
      showAscii = true,
      colors,
      diff = null,
      windowSize = 128 * 1024,
      className = "",
      selectedOffsetRange,
      onSelectedOffsetRangeChange,
      onScroll,
      onOffsetHighlight,
      onByteClick,
      onByteSelect
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasInstanceRef = useRef<HexCanvas | null>(null)

    // Initialize HexCanvas instance
    useEffect(() => {
      if (!containerRef.current) return

      const options: HexCanvasOptions = {
        windowSize,
        showAscii,
        colors,
        diff
      }

      canvasInstanceRef.current = new HexCanvas(
        containerRef.current,
        file,
        options
      )

      // Subscribe to events
      const handleSelectionChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ range: SelectionRange }>
        if (onSelectedOffsetRangeChange) {
          onSelectedOffsetRangeChange(customEvent.detail.range)
        }
      }

      const handleScroll = (event: Event) => {
        const customEvent = event as CustomEvent<{ scrollTop: number }>
        if (onScroll) {
          onScroll(customEvent.detail.scrollTop)
        }
      }

      const handleOffsetHighlight = (event: Event) => {
        const customEvent = event as CustomEvent<{ offset: number | null }>
        if (onOffsetHighlight) {
          onOffsetHighlight(customEvent.detail.offset)
        }
      }

      const handleByteClick = (event: Event) => {
        const customEvent = event as CustomEvent<{ offset: number }>
        if (onByteClick) {
          onByteClick(customEvent.detail.offset)
        }
      }

      const handleByteSelect = (event: Event) => {
        const customEvent = event as CustomEvent<{ offset: number | null }>
        if (onByteSelect) {
          onByteSelect(customEvent.detail.offset)
        }
      }

      canvasInstanceRef.current.addEventListener(
        "selectionChange",
        handleSelectionChange
      )
      canvasInstanceRef.current.addEventListener("scroll", handleScroll)
      canvasInstanceRef.current.addEventListener(
        "offsetHighlight",
        handleOffsetHighlight
      )
      canvasInstanceRef.current.addEventListener("byteClick", handleByteClick)
      canvasInstanceRef.current.addEventListener("byteSelect", handleByteSelect)

      return () => {
        if (canvasInstanceRef.current) {
          canvasInstanceRef.current.removeEventListener(
            "selectionChange",
            handleSelectionChange
          )
          canvasInstanceRef.current.removeEventListener("scroll", handleScroll)
          canvasInstanceRef.current.removeEventListener(
            "offsetHighlight",
            handleOffsetHighlight
          )
          canvasInstanceRef.current.removeEventListener(
            "byteClick",
            handleByteClick
          )
          canvasInstanceRef.current.removeEventListener(
            "byteSelect",
            handleByteSelect
          )
          canvasInstanceRef.current.destroy()
          canvasInstanceRef.current = null
        }
      }
    }, []) // Only run once on mount

    // Update file when it changes
    useEffect(() => {
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.setFile(file)
      }
    }, [file])

    // Update options when they change
    useEffect(() => {
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.setOptions({
          showAscii,
          colors,
          diff,
          windowSize
        })
      }
    }, [showAscii, colors, diff, windowSize])

    // Sync selectedOffsetRange prop to canvas instance
    useEffect(() => {
      if (canvasInstanceRef.current && selectedOffsetRange !== undefined) {
        const currentRange = canvasInstanceRef.current.getSelectedRange()
        // Only update if different to avoid loops
        if (
          currentRange?.start !== selectedOffsetRange?.start ||
          currentRange?.end !== selectedOffsetRange?.end
        ) {
          canvasInstanceRef.current.setSelectedRange(selectedOffsetRange)
        }
      }
    }, [selectedOffsetRange])

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        scrollToOffset: (offset: number) => {
          canvasInstanceRef.current?.scrollToOffset(offset)
        },
        getSelectedRange: () => {
          return canvasInstanceRef.current?.getSelectedRange() ?? null
        },
        getScrollTop: () => {
          return canvasInstanceRef.current?.getScrollTop() ?? 0
        },
        setSelectedRange: (range: SelectionRange) => {
          canvasInstanceRef.current?.setSelectedRange(range)
        }
      }),
      []
    )

    return (
      <div
        ref={containerRef}
        className={`h-full w-full overflow-auto relative ${className}`}
        style={{ position: "relative" }}
      />
    )
  }
)

HexCanvasReact.displayName = "HexCanvasReact"
