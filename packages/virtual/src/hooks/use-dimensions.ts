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
      const value = {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
      setDimensions((prev) => {
        if (prev.width === value.width && prev.height === value.height) {
          return prev
        }
        console.log("[setDimensions]", value)
        return value
      })
    }

    // Initial dimensions
    // updateDimensions()

    // Use ResizeObserver to track dimension changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [element, cacheKey])

  return dimensions
}
