import { useEffect, useImperativeHandle, useRef } from "react"
import type { Ref, RefObject } from "react"

import type { DiffResult } from "@hexed/types"

import { HexCanvas, type HexCanvasOptions } from "./hex-canvas"
import type { HexCanvasColors } from "./utils/colors"
import type { SelectionRange } from "./utils/canvas"

type ToOnHandlers<T> = Partial<{
  [K in keyof T as `on${Capitalize<string & K>}`]: (payload: T[K]) => void
}>

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

export type HexCanvasEventCallbacks = ToOnHandlers<HexCanvasEventMap>

export type UseHexCanvasOptions = {
  file: File | null
  showAscii?: boolean
  colors?: Partial<HexCanvasColors>
  diff?: DiffResult | null
  windowSize?: number
  selectedOffsetRange?: SelectionRange
}

export type HexCanvasHandle = {
  scrollToOffset: (offset: number) => void
  getSelectedRange: () => SelectionRange
  getScrollTop: () => number
  setSelectedRange: (range: SelectionRange) => void
}

export type UseHexCanvasReturn = ReturnType<typeof useHexCanvas>

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
) {
  const {
    file,
    showAscii = true,
    colors,
    diff = null,
    windowSize = 128 * 1024,
    selectedOffsetRange,
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

  return canvasInstanceRef
}
