import { useCallback, useEffect, useState } from "react"

/**
 * Hook for tracking scroll position of a container element
 * @param containerElement - The scrollable container element (can be null initially)
 * @returns Current scrollTop value
 */
export function useScrollTop(containerElement: HTMLElement | null): number {
  const [scrollTop, setScrollTop] = useState(0)

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (containerElement) {
      setScrollTop(containerElement.scrollTop)
    }
  }, [containerElement])

  useEffect(() => {
    if (!containerElement) return

    containerElement.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      containerElement.removeEventListener("scroll", handleScroll)
    }
  }, [containerElement, handleScroll])

  return scrollTop
}
