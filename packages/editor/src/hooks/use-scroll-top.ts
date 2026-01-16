import { useCallback, useEffect, useState } from "react"

/**
 * Hook for tracking scroll position of a container element
 * @param containerElement - The scrollable container element (can be null initially)
 * @param scrollTopRef - Optional ref to sync scrollTop without causing re-renders
 * @returns Current scrollTop value (for components that need it)
 */
export function useScrollTop(
  containerElement: HTMLElement | null,
  scrollTopRef?: React.MutableRefObject<number>
): number {
  const scrollableElement = containerElement?.firstChild as HTMLElement | null
  const [scrollTop, setScrollTop] = useState(0)

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (scrollableElement) {
      const newScrollTop = scrollableElement.scrollTop
      // Update ref if provided (no re-render)
      if (scrollTopRef) {
        scrollTopRef.current = newScrollTop
      }
      // Update state (causes re-render, but only if component needs it)
      setScrollTop(newScrollTop)
    }
  }, [scrollableElement, scrollTopRef])

  useEffect(() => {
    if (!scrollableElement) return

    scrollableElement.addEventListener("scroll", handleScroll, {
      passive: true
    })
    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll)
    }
  }, [scrollableElement, handleScroll])

  return scrollTop
}
