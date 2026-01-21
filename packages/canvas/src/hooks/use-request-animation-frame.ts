import { useEffect } from "react"

/**
 * Hook that schedules a callback using requestAnimationFrame
 * Automatically cancels pending frames on cleanup or when dependencies change
 * @param callback - Function to call on the next animation frame
 * @param deps - Dependency array that triggers rescheduling
 */
export function useRequestAnimationFrame(
  callback: () => void,
  deps: React.DependencyList
): void {
  useEffect(() => {
    const frameId = requestAnimationFrame(callback)
    return () => cancelAnimationFrame(frameId)
  }, deps)
}
