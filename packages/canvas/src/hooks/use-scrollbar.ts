import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { scrollbarWidth } from "../utils/constants"

const SCROLLBAR_TRACK_COLOR = "#0000FF" // Blue
const SCROLLBAR_THUMB_COLOR = "#FF0000" // Red

export interface ScrollbarMetrics {
  trackX: number
  trackY: number
  trackWidth: number
  trackHeight: number
  thumbX: number
  thumbY: number
  thumbWidth: number
  thumbHeight: number
}

export interface UseScrollbarParams {
  canvasRef: RefObject<HTMLCanvasElement | null>
  scrollTopRef: RefObject<number>
  viewportHeight: number
  totalHeight: number
  canvasWidth: number
  setScrollTop: (next: number | ((prev: number) => number)) => void
  maxScrollTop: number
}

export interface UseScrollbarReturn {
  isDragging: boolean
  scrollbarMetrics: ScrollbarMetrics | null
  handleMouseDown: (event: React.MouseEvent<HTMLCanvasElement>) => boolean
  handleMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void
  handleMouseUp: () => void
}

/**
 * Hook to manage scrollbar interactions (dragging thumb, clicking track)
 */
export function useScrollbar({
  canvasRef,
  scrollTopRef,
  viewportHeight,
  totalHeight,
  canvasWidth,
  setScrollTop,
  maxScrollTop
}: UseScrollbarParams): UseScrollbarReturn {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartYRef = useRef<number>(0)
  const dragStartScrollTopRef = useRef<number>(0)

  // Calculate scrollbar metrics - always recalculate to get latest scrollTop
  const calculateMetrics = useCallback((): ScrollbarMetrics | null => {
    if (maxScrollTop <= 0) return null

    const trackX = canvasWidth - scrollbarWidth
    const trackY = 0
    const trackWidth = scrollbarWidth
    const trackHeight = viewportHeight

    // Calculate thumb height based on viewport/total ratio
    const thumbHeight = Math.max(
      20,
      Math.floor((viewportHeight / totalHeight) * trackHeight)
    )

    // Calculate thumb position based on scroll position (always read current value)
    const scrollTop = scrollTopRef.current ?? 0
    const thumbY =
      (scrollTop / maxScrollTop) * (trackHeight - thumbHeight) + trackY

    return {
      trackX,
      trackY,
      trackWidth,
      trackHeight,
      thumbX: trackX,
      thumbY,
      thumbWidth: trackWidth,
      thumbHeight
    }
  }, [canvasWidth, viewportHeight, totalHeight, maxScrollTop, scrollTopRef])

  // Check if a point is within the scrollbar track
  const isPointInTrack = useCallback(
    (x: number, y: number): boolean => {
      const metrics = calculateMetrics()
      if (!metrics) return false
      return (
        x >= metrics.trackX &&
        x <= metrics.trackX + metrics.trackWidth &&
        y >= metrics.trackY &&
        y <= metrics.trackY + metrics.trackHeight
      )
    },
    [calculateMetrics]
  )

  // Check if a point is within the scrollbar thumb
  const isPointInThumb = useCallback(
    (x: number, y: number): boolean => {
      const metrics = calculateMetrics()
      if (!metrics) return false
      return (
        x >= metrics.thumbX &&
        x <= metrics.thumbX + metrics.thumbWidth &&
        y >= metrics.thumbY &&
        y <= metrics.thumbY + metrics.thumbHeight
      )
    },
    [calculateMetrics]
  )

  // Handle mouse down - returns true if scrollbar was clicked
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): boolean => {
      if (!canvasRef.current) return false

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // Recalculate metrics to get latest scroll position
      const metrics = calculateMetrics()
      if (!metrics) return false

      // Check if clicking on thumb
      if (isPointInThumb(mouseX, mouseY)) {
        setIsDragging(true)
        dragStartYRef.current = mouseY
        dragStartScrollTopRef.current = scrollTopRef.current ?? 0
        return true
      }

      // Check if clicking on track (but not thumb)
      if (isPointInTrack(mouseX, mouseY)) {
        // Calculate target scroll position based on click position
        const clickY = mouseY - metrics.trackY
        const thumbHeight = metrics.thumbHeight
        const trackHeight = metrics.trackHeight
        const availableHeight = trackHeight - thumbHeight

        // Calculate scroll position (center thumb on click)
        const targetThumbY = clickY - thumbHeight / 2
        const clampedThumbY = Math.max(
          0,
          Math.min(availableHeight, targetThumbY)
        )
        const scrollRatio = clampedThumbY / availableHeight
        const targetScrollTop = scrollRatio * maxScrollTop

        setScrollTop(targetScrollTop)
        return true
      }

      return false
    },
    [
      canvasRef,
      isPointInThumb,
      isPointInTrack,
      scrollTopRef,
      maxScrollTop,
      setScrollTop,
      calculateMetrics
    ]
  )

  // Handle mouse move - update scroll position when dragging
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !canvasRef.current) return

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const mouseY = event.clientY - rect.top

      // Recalculate metrics to get current track/thumb dimensions
      const metrics = calculateMetrics()
      if (!metrics) return

      const deltaY = mouseY - dragStartYRef.current
      const trackHeight = metrics.trackHeight
      const thumbHeight = metrics.thumbHeight
      const availableHeight = trackHeight - thumbHeight

      // Calculate scroll delta
      const scrollDelta = (deltaY / availableHeight) * maxScrollTop
      const newScrollTop = dragStartScrollTopRef.current + scrollDelta

      setScrollTop(newScrollTop)
    },
    [isDragging, canvasRef, maxScrollTop, setScrollTop, calculateMetrics]
  )

  // Handle mouse up - stop dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      dragStartYRef.current = 0
      dragStartScrollTopRef.current = 0
    }
  }, [isDragging])

  // Handle global mouse up to stop dragging if mouse leaves canvas
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      dragStartYRef.current = 0
      dragStartScrollTopRef.current = 0
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging])

  return {
    isDragging,
    scrollbarMetrics: calculateMetrics(),
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
