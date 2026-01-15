import { useEffect, useState } from "react"

interface Dimensions {
  width: number
  height: number
}

/**
 * Hook for tracking container element dimensions using ResizeObserver
 * @param containerRef - Ref to the container element to observe
 * @returns Current dimensions of the container
 */
export function useDimensions<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null>
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height
      })
    }

    // Initial dimensions
    updateDimensions()

    // Use ResizeObserver to track dimension changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])

  return dimensions
}
