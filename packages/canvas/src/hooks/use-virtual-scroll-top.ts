import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject
} from "react"

import { useRequestAnimationFrame } from "./use-request-animation-frame"

export const useVirtualScrollTop = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  scrollTopRef: RefObject<number>,
  viewportHeight: number,
  totalHeight: number,
  options?: {
    initialScrollTop?: number
    onScroll?: (scrollTop: number) => void
  }
) => {
  const { initialScrollTop = 0, onScroll } = options ?? {}

  const maxScrollTop = useMemo(() => {
    const max = Math.max(0, Math.floor(totalHeight - viewportHeight))
    return Number.isFinite(max) ? max : 0
  }, [totalHeight, viewportHeight])

  const clamp = useCallback(
    (v: number) => Math.min(maxScrollTop, Math.max(0, Math.floor(v))),
    [maxScrollTop]
  )

  const [scrollTop] = useState(() => clamp(initialScrollTop))

  // Sync scrollTop state to ref (only when state changes from non-scroll sources)
  useEffect(() => {
    // Only sync if ref doesn't already match (avoid redundant updates from scroll handler)
    if (scrollTopRef.current !== scrollTop) {
      scrollTopRef.current = scrollTop
    }
  }, [scrollTop, scrollTopRef])

  const rafRef = useRef<number | null>(null)

  const commit = useCallback(
    (nextRaw: number, updateState = false) => {
      const next = clamp(nextRaw)
      if (next === scrollTopRef.current && !updateState) return

      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        scrollTopRef.current = next
      })
    },
    [clamp, onScroll]
  )

  const setScrollTop = useCallback(
    (next: number | ((prev: number) => number)) => {
      const prev = scrollTopRef.current
      commit(typeof next === "function" ? next(prev) : next, true)
    },
    [commit]
  )

  // clamp on dimension changes
  useEffect(() => {
    commit(scrollTopRef.current, true)
  }, [maxScrollTop, commit])

  // wheel -> virtual scrollTop
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      commit(scrollTopRef.current + e.deltaY, true)
    }

    el.addEventListener("wheel", onWheel, { passive: true })
    return () => el.removeEventListener("wheel", onWheel)
  }, [canvasRef, commit])

  return { scrollTop, maxScrollTop, viewportHeight, setScrollTop } as const
}
