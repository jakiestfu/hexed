import { useEffect, useState } from "react"

interface Dimensions {
  width: number
  height: number
}

/**
 * Hook for tracking container element dimensions using ResizeObserver
 * @param containerRef - Ref to the container element to observe, or the element itself
 * @returns Current dimensions of the container
 */
export function useDimensions<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null> | T | null,
  cacheKey?: string
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0
  })

  // Get the element - handle both ref object and direct element
  const element =
    containerRef &&
    typeof containerRef === "object" &&
    "current" in containerRef
      ? containerRef.current
      : (containerRef as T | null)

  useEffect(() => {
    if (!element) return

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height
      })
    }

    // Initial dimensions
    updateDimensions()

    // Use ResizeObserver to track dimension changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [element, cacheKey])

  return dimensions
}
