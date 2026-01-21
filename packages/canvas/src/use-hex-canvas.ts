import { useEffect, useImperativeHandle, useRef } from "react"
import type { Ref, RefObject } from "react"

import type { DiffResult } from "@hexed/types"

import { HexCanvas, type HexCanvasOptions } from "./hex-canvas"
import type { HexCanvasColors } from "./utils/colors"
import type { SelectionRange } from "./utils/canvas"

/**
 * Type map for HexCanvas events and their payload types
 */
export type HexCanvasEventMap = {
  selectionChange: { range: SelectionRange }
  scroll: { scrollTop: number }
  offsetHighlight: { offset: number | null }
  byteSelect: { offset: number | null }
  byteClick: { offset: number }
}

export interface UseHexCanvasOptions {
  file: File | null
  showAscii?: boolean
  colors?: Partial<HexCanvasColors>
  diff?: DiffResult | null
  windowSize?: number
  selectedOffsetRange?: SelectionRange
  onSelectedOffsetRangeChange?: (payload: HexCanvasEventMap["selectionChange"]) => void
  onScroll?: (payload: HexCanvasEventMap["scroll"]) => void
  onOffsetHighlight?: (payload: HexCanvasEventMap["offsetHighlight"]) => void
  onByteClick?: (payload: HexCanvasEventMap["byteClick"]) => void
  onByteSelect?: (payload: HexCanvasEventMap["byteSelect"]) => void
}

export interface HexCanvasHandle {
  scrollToOffset: (offset: number) => void
  getSelectedRange: () => SelectionRange
  getScrollTop: () => number
  setSelectedRange: (range: SelectionRange) => void
}

export interface UseHexCanvasReturn {
  canvasRef: RefObject<HexCanvas | null>
}

/**
 * Type-safe hook for subscribing to HexCanvas events
 * @param canvas - The HexCanvas instance or ref (can be null)
 * @param eventName - The name of the event to subscribe to
 * @param callback - The callback function to call when the event fires, or null/undefined to unsubscribe
 */
export function useHexCanvasEvent<K extends keyof HexCanvasEventMap>(
  canvas: HexCanvas | RefObject<HexCanvas | null> | null,
  eventName: K,
  callback: ((payload: HexCanvasEventMap[K]) => void) | null | undefined
): void {
  useEffect(() => {
    // Extract canvas instance from ref if needed
    const canvasInstance =
      canvas && "current" in canvas ? canvas.current : (canvas as HexCanvas | null)

    // If no callback provided, do nothing
    if (!callback || !canvasInstance) {
      return
    }

    // Create event handler that extracts the payload and calls the callback
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<HexCanvasEventMap[K]>
      callback(customEvent.detail)
    }

    // Subscribe to the event
    canvasInstance.addEventListener(eventName, handleEvent)

    // Cleanup: unsubscribe when component unmounts or dependencies change
    return () => {
      if (canvasInstance) {
        canvasInstance.removeEventListener(eventName, handleEvent)
      }
    }
    // Note: We intentionally don't include `canvas` in deps when it's a ref
    // because ref.current changes don't trigger re-renders. Instead, we check
    // the current value each time the effect runs (when callback/eventName change)
  }, [
    // Use a stable reference check - if canvas is a ref, we check its current value
    canvas && "current" in canvas ? canvas.current : canvas,
    eventName,
    callback
  ])
}

/**
 * Hook for managing HexCanvas instance lifecycle and providing imperative handle
 * @param containerRef - Ref to the container element where the canvas will be rendered
 * @param options - Configuration options for the HexCanvas instance
 * @param ref - Optional ref to expose imperative handle
 */
export function useHexCanvas(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseHexCanvasOptions,
  ref?: Ref<HexCanvasHandle>
): UseHexCanvasReturn {
  const {
    file,
    showAscii = true,
    colors,
    diff = null,
    windowSize = 128 * 1024,
    selectedOffsetRange,
    onSelectedOffsetRangeChange,
    onScroll,
    onOffsetHighlight,
    onByteClick,
    onByteSelect
  } = options

  const canvasInstanceRef = useRef<HexCanvas | null>(null)

  // Initialize HexCanvas instance
  useEffect(() => {
    if (!containerRef.current) return

    const canvasOptions: HexCanvasOptions = {
      windowSize,
      showAscii,
      colors,
      diff
    }

    canvasInstanceRef.current = new HexCanvas(
      containerRef.current,
      file,
      canvasOptions
    )

    // Subscribe to events
    const handleSelectionChange = (event: Event) => {
      const customEvent = event as CustomEvent<HexCanvasEventMap["selectionChange"]>
      if (onSelectedOffsetRangeChange) {
        onSelectedOffsetRangeChange(customEvent.detail)
      }
    }

    const handleScroll = (event: Event) => {
      const customEvent = event as CustomEvent<HexCanvasEventMap["scroll"]>
      if (onScroll) {
        onScroll(customEvent.detail)
      }
    }

    const handleOffsetHighlight = (event: Event) => {
      const customEvent = event as CustomEvent<HexCanvasEventMap["offsetHighlight"]>
      if (onOffsetHighlight) {
        onOffsetHighlight(customEvent.detail)
      }
    }

    const handleByteClick = (event: Event) => {
      const customEvent = event as CustomEvent<HexCanvasEventMap["byteClick"]>
      if (onByteClick) {
        onByteClick(customEvent.detail)
      }
    }

    const handleByteSelect = (event: Event) => {
      const customEvent = event as CustomEvent<HexCanvasEventMap["byteSelect"]>
      if (onByteSelect) {
        onByteSelect(customEvent.detail)
      }
    }

    const instance = canvasInstanceRef.current
    instance.addEventListener("selectionChange", handleSelectionChange)
    instance.addEventListener("scroll", handleScroll)
    instance.addEventListener("offsetHighlight", handleOffsetHighlight)
    instance.addEventListener("byteClick", handleByteClick)
    instance.addEventListener("byteSelect", handleByteSelect)

    return () => {
      if (instance) {
        instance.removeEventListener("selectionChange", handleSelectionChange)
        instance.removeEventListener("scroll", handleScroll)
        instance.removeEventListener("offsetHighlight", handleOffsetHighlight)
        instance.removeEventListener("byteClick", handleByteClick)
        instance.removeEventListener("byteSelect", handleByteSelect)
        instance.destroy()
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

  return {
    canvasRef: canvasInstanceRef
  }
}
