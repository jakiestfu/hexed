import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react"
import type { FunctionComponent } from "react"

import { FormattedRow } from "@hexed/binary-utils"
import type { DiffResult } from "@hexed/types"

import {
  useCalculateEditorLayout,
  VisibleDataLayoutMetrics
} from "./hooks/use-calculate-editor-layout"
import { useDrawCanvas } from "./hooks/use-draw-canvas"
import { useKeyboardNavigation } from "./hooks/use-keyboard-navigation"
import { useSelection } from "./hooks/use-selection"
import {
  calculateScrollPosition,
  calculateSelectionRange,
  didDragOccur,
  isOffsetInRange,
  type SelectionRange
} from "./utils/canvas"
import { getDefaultColors } from "./utils/colors"
import {
  getOffsetFromPosition as getOffsetFromPositionUtil,
  getRowFromY as getRowFromYUtil,
  LayoutMetrics
} from "./utils/coordinates"

export interface HexCanvasProps {
  rows: FormattedRow[]
  layout: LayoutMetrics | null
  visibleDataLayout: VisibleDataLayoutMetrics
  data: Uint8Array
  showAscii?: boolean
  className?: string
  diff?: DiffResult | null
  highlightedOffset?: number | null
  selectedOffset?: number | null
  selectedOffsetRange?: SelectionRange
  onSelectedOffsetChange?: (offset: number | null) => void
  onSelectedOffsetRangeChange?: (range: SelectionRange) => void
  colors?: Partial<HexCanvasColors>
  totalSize?: number
  dimensions: { width: number; height: number }
  onRequestScrollToOffset?: (offset: number, targetScrollTop: number) => void
  containerRef: React.RefObject<HTMLElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export interface HexCanvasRef {
  scrollToOffset: (offset: number) => void
}

export interface HexCanvasColors {
  background: string
  addressText: string
  byteText: string
  asciiText: string
  border: string
  diffAdded: { bg: string; text: string }
  diffRemoved: { bg: string; text: string }
  diffModified: { bg: string; text: string }
  highlight: { bg: string; border: string }
  rowHover: string
  byteHover: { bg: string; border: string }
  selection: { bg: string; border: string }
}

export const HexCanvas = forwardRef<HexCanvasRef, HexCanvasProps>(
  (
    {
      rows,
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
      totalSize,
      dimensions,
      onRequestScrollToOffset,
      containerRef,
      canvasRef,
      visibleDataLayout: { rowsLength, totalHeight },
      layout
    },
    ref
  ) => {
    // const canvasRef = useRef<HTMLCanvasElement>(null)
    const [themeChangeCounter, setThemeChangeCounter] = useState(0)
    const [internalHighlightedOffset, setInternalHighlightedOffset] = useState<
      number | null
    >(null)
    const [hoveredRow, setHoveredRow] = useState<number | null>(null)
    const [hoveredOffset, setHoveredOffset] = useState<number | null>(null)
    const [hasFocus, setHasFocus] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStartOffset, setDragStartOffset] = useState<number | null>(null)
    const justFinishedDragRef = useRef(false)
    const shouldDeselectRef = useRef(false)
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

    // Use prop if provided, otherwise use internal state
    const highlightedOffset =
      propHighlightedOffset !== null
        ? propHighlightedOffset
        : internalHighlightedOffset

    // Watch for theme changes (dark mode)
    useEffect(() => {
      const observer = new MutationObserver(() => {
        // Increment counter to trigger color recalculation
        setThemeChangeCounter((prev) => prev + 1)
      })

      // Observe the document element for class changes (dark mode)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"]
      })

      return () => {
        observer.disconnect()
      }
    }, [])

    // Compute colors from props and CSS variables
    const colors = useMemo(() => {
      if (!containerRef?.current) return {} as HexCanvasColors
      const defaults = getDefaultColors(containerRef.current)

      return {
        ...defaults,
        ...colorsProp,
        diffAdded: { ...defaults.diffAdded, ...colorsProp?.diffAdded },
        diffRemoved: { ...defaults.diffRemoved, ...colorsProp?.diffRemoved },
        diffModified: { ...defaults.diffModified, ...colorsProp?.diffModified },
        highlight: { ...defaults.highlight, ...colorsProp?.highlight },
        byteHover: { ...defaults.byteHover, ...colorsProp?.byteHover },
        selection: { ...defaults.selection, ...colorsProp?.selection }
      }
    }, [
      colorsProp,
      containerRef,
      dimensions.width,
      dimensions.height,
      themeChangeCounter
    ])

    // Expose scrollToOffset via ref
    const scrollToOffset = useCallback(
      (offset: number) => {
        if (!layout || !onRequestScrollToOffset) return
        const targetScrollTop = calculateScrollPosition(
          offset,
          layout,
          dimensions.height
        )

        // Set highlighted offset
        setInternalHighlightedOffset(offset)

        // Clear existing timeout
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current)
        }

        // Auto-clear highlight after 2 seconds
        highlightTimeoutRef.current = setTimeout(() => {
          setInternalHighlightedOffset(null)
          highlightTimeoutRef.current = null
        }, 2000)

        onRequestScrollToOffset(offset, targetScrollTop)
      },
      [layout, dimensions.height, onRequestScrollToOffset]
    )

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current)
        }
      }
    }, [])

    useImperativeHandle(ref, () => ({
      scrollToOffset
    }))

    // Callback ref to set both internal and external refs synchronously
    // const setCanvasRef = useCallback(
    //   (element: HTMLCanvasElement | null) => {
    //     canvasRef.current = element
    //     if (externalCanvasRef) {
    //       externalCanvasRef.current = element
    //     }
    //   },
    //   [externalCanvasRef]
    // )

    // Use selection hook
    const { selectedOffset, handleClick: handleSelectionClick } = useSelection({
      selectedOffset: propSelectedOffset,
      onSelectedOffsetChange
    })

    // Determine the active selection range (prop takes precedence, fallback to single offset)
    const selectedRange: SelectionRange = useMemo(() => {
      return calculateSelectionRange(propSelectedOffsetRange, selectedOffset)
    }, [propSelectedOffsetRange, selectedOffset])

    // Helper function to calculate row index from mouse Y coordinate
    const getRowFromY = useCallback(
      (mouseY: number): number | null => {
        if (!layout) return null
        return getRowFromYUtil(
          mouseY,
          (() => {
            const firstChild = containerRef?.current?.firstChild
            return firstChild && firstChild instanceof HTMLElement
              ? firstChild.scrollTop
              : 0
          })(),
          layout,
          rowsLength
        )
      },
      [layout, containerRef, rowsLength]
    )

    // Helper function to calculate byte offset from mouse position
    const getOffsetFromPosition = useCallback(
      (mouseX: number, mouseY: number): number | null => {
        if (!layout) return null
        return getOffsetFromPositionUtil(
          mouseX,
          mouseY,
          layout,
          rows,
          showAscii,
          getRowFromY
        )
      },
      [layout, rows, showAscii, getRowFromY]
    )

    // Extract the earliest byte from the range for keyboard navigation
    const keyboardSelectedOffset = useMemo(() => {
      if (selectedRange) {
        return Math.min(selectedRange.start, selectedRange.end)
      }
      return selectedOffset
    }, [selectedRange, selectedOffset])

    // Use keyboard navigation hook
    const { handleKeyDown } = useKeyboardNavigation({
      selectedOffset: keyboardSelectedOffset,
      dataLength: data.length,
      bytesPerRow: layout?.bytesPerRow ?? 16,
      viewportHeight: dimensions.height,
      rowHeight: layout?.rowHeight ?? 20,
      onOffsetChange: (offset: number) => {
        if (onSelectedOffsetRangeChange) {
          onSelectedOffsetRangeChange({ start: offset, end: offset })
        } else {
          handleSelectionClick(offset)
        }
      },
      onClearSelection: () => {
        if (onSelectedOffsetRangeChange) {
          onSelectedOffsetRangeChange(null)
        } else {
          handleSelectionClick(null)
        }
      },
      scrollToOffset
    })

    // Add global keyboard event listener
    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown)
      return () => {
        window.removeEventListener("keydown", handleKeyDown)
      }
    }, [handleKeyDown])

    // Handle mouse move to detect hover and drag
    const handleMouseMove = useCallback(
      (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!layout || !canvasRef.current) {
          setHoveredRow(null)
          setHoveredOffset(null)
          return
        }

        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        // Mouse coordinates are in CSS pixels (not device pixels)
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const rowIndex = getRowFromY(mouseY)
        const offset = getOffsetFromPosition(mouseX, mouseY)

        setHoveredRow(rowIndex)
        setHoveredOffset(offset)

        // Handle drag selection
        if (
          isDragging &&
          dragStartOffset !== null &&
          offset !== null &&
          onSelectedOffsetRangeChange
        ) {
          onSelectedOffsetRangeChange({ start: dragStartOffset, end: offset })
        }
      },
      [
        layout,
        getRowFromY,
        getOffsetFromPosition,
        isDragging,
        dragStartOffset,
        onSelectedOffsetRangeChange
      ]
    )

    // Handle mouse leave to clear hover
    const handleMouseLeave = useCallback(() => {
      setHoveredRow(null)
      setHoveredOffset(null)
    }, [])

    // Handle mouse down to start drag selection
    const handleMouseDown = useCallback(
      (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!layout || !canvasRef.current) return

        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const offset = getOffsetFromPosition(mouseX, mouseY)
        if (offset !== null) {
          // Handle shift-click to extend selection
          if (event.shiftKey) {
            if (selectedRange !== null && onSelectedOffsetRangeChange) {
              // Extend selection: keep the start of the current selection as anchor,
              // extend the end to the clicked offset
              const anchor = selectedRange.start
              onSelectedOffsetRangeChange({
                start: anchor,
                end: offset
              })
            } else if (selectedOffset !== null && onSelectedOffsetRangeChange) {
              // Fallback: extend from current single selection
              // Use the selected offset as anchor
              onSelectedOffsetRangeChange({
                start: selectedOffset,
                end: offset
              })
            } else if (onSelectedOffsetRangeChange) {
              // No existing selection, just select the clicked offset
              onSelectedOffsetRangeChange({ start: offset, end: offset })
            } else {
              // Fallback to single selection handler
              handleSelectionClick(offset)
            }
            // Don't start dragging on shift-click
            return
          }

          // Check if clicking an already-selected single byte to deselect it
          const shouldDeselect =
            selectedRange !== null &&
            selectedRange.start === selectedRange.end &&
            isOffsetInRange(offset, selectedRange)

          shouldDeselectRef.current = shouldDeselect

          setIsDragging(true)
          setDragStartOffset(offset)

          // Only set selection if we're not deselecting
          if (!shouldDeselect) {
            if (onSelectedOffsetRangeChange) {
              onSelectedOffsetRangeChange({ start: offset, end: offset })
            } else {
              handleSelectionClick(offset)
            }
          }
        }

        // Focus canvas for keyboard navigation
        canvas.focus()
      },
      [
        layout,
        getOffsetFromPosition,
        handleSelectionClick,
        onSelectedOffsetRangeChange,
        selectedRange,
        selectedOffset
      ]
    )

    // Handle mouse up to end drag selection
    const handleMouseUp = useCallback(() => {
      if (isDragging) {
        // Check if we actually dragged (mouse moved) by comparing current selection
        // If selection range changed from initial single-byte selection, user dragged
        const dragOccurred = didDragOccur(dragStartOffset, selectedRange)

        setIsDragging(false)
        setDragStartOffset(null)

        // If we didn't drag and should deselect, deselect now
        if (!dragOccurred && shouldDeselectRef.current) {
          if (onSelectedOffsetRangeChange) {
            onSelectedOffsetRangeChange(null)
          } else {
            handleSelectionClick(null)
          }
          shouldDeselectRef.current = false
        }

        // Mark that we just finished a drag to prevent click handler from interfering
        justFinishedDragRef.current = true
        // Reset the flag after a short delay to allow click event to be ignored
        setTimeout(() => {
          justFinishedDragRef.current = false
        }, 0)
      }
    }, [
      isDragging,
      dragStartOffset,
      selectedRange,
      onSelectedOffsetRangeChange,
      handleSelectionClick
    ])

    // Add global mouseup handler to handle dragging outside canvas
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        if (isDragging) {
          // Check if we actually dragged (mouse moved) by comparing current selection
          const dragOccurred = didDragOccur(dragStartOffset, selectedRange)

          setIsDragging(false)
          setDragStartOffset(null)

          // If we didn't drag and should deselect, deselect now
          if (!dragOccurred && shouldDeselectRef.current) {
            if (onSelectedOffsetRangeChange) {
              onSelectedOffsetRangeChange(null)
            } else {
              handleSelectionClick(null)
            }
            shouldDeselectRef.current = false
          }

          // Mark that we just finished a drag to prevent click handler from interfering
          justFinishedDragRef.current = true
          // Reset the flag after a short delay to allow click event to be ignored
          setTimeout(() => {
            justFinishedDragRef.current = false
          }, 0)
        }
      }

      if (isDragging) {
        window.addEventListener("mouseup", handleGlobalMouseUp)
        return () => {
          window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
      }
    }, [
      isDragging,
      dragStartOffset,
      selectedRange,
      onSelectedOffsetRangeChange,
      handleSelectionClick
    ])

    // Handle click outside canvas to clear selection
    // useOnClickOutside(canvasRef as React.RefObject<HTMLElement>, () => {
    //   handleSelectionClick(null);
    // });

    // Render canvas using requestAnimationFrame
    useDrawCanvas(
      containerRef,
      canvasRef,
      layout,
      dimensions,
      rows,
      showAscii,
      colors,
      diff,
      highlightedOffset,
      selectedRange,
      hoveredRow,
      hoveredOffset
    )

    return (
      <canvas
        ref={canvasRef}
        className={`font-mono ${className}`}
        tabIndex={0}
        style={{
          display: "block",
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 1,
          userSelect: "none",
          outline: "none"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    )
  }
)

HexCanvas.displayName = "HexCanvas"
