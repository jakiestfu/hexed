import { useEffect, useState } from "react"
import type { RefObject } from "react"

interface UseSimpleWindowOffsetsParams {
  containerRef: RefObject<HTMLElement | null>
  viewportHeight: number
  windowSize: number
}

/**
 * Simple hook that manages window offsets based on scroll position.
 * Returns [windowStart, windowEnd] byte offsets for the current window.
 *
 * If scroll position is within viewportHeight of the top, returns [0, windowSize].
 * If scroll position is at windowSize + 1 or beyond, returns the next window.
 */
export const useSimpleWindowOffsets = ({
  containerRef,
  windowSize,
  totalSize
}: {
  containerRef: React.RefObject<HTMLElement | null>
  windowSize: number
  totalSize: number
}): [number, number] => {
  const [range, setRange] = useState<[number, number]>([0, windowSize])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      const scrollTop = el.scrollTop
      const idx = Math.floor(scrollTop / totalSize)

      const start = idx * windowSize
      const end = start + windowSize

      setRange((prev) => {
        if (prev[0] === start && prev[1] === end) {
          return prev
        }
        return [start, end]
      })
      // const rawStart = Math.floor(scrollTop / windowSize) * windowSize
      // const start =
      //   totalSize != null
      //     ? Math.min(rawStart, Math.max(0, totalSize - windowSize))
      //     : rawStart

      // const end =
      //   totalSize != null
      //     ? Math.min(start + windowSize, totalSize)
      //     : start + windowSize

      // console.log({ scrollTop, rawStart, start, end, totalSize })

      // setRange((prev) => {
      //   // 🔑 Bail if nothing changed
      //   if (prev[0] === start && prev[1] === end) {
      //     return prev
      //   }
      //   return [start, end]
      // })
    }

    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [containerRef, windowSize, totalSize])

  return range
}
