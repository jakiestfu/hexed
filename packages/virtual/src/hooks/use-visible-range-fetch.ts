import { useCallback, useEffect, useRef } from "react"
import { rowHeight } from "../constants"

type EnsureRowsFn = (
  rowStart: number,
  rowEndInclusive: number,
  signal?: AbortSignal
) => Promise<void>

export function useVisibleRangeFetch({
  file,
  rowCount,
  ensureRows,
  dimensions,
  overscanCount
}: {
  file: File | null
  rowCount: number
  ensureRows: EnsureRowsFn
  dimensions: { width: number; height: number }
  overscanCount: number
}) {
  // Track last fetched range to avoid redundant calls
  const lastFetchedRangeRef = useRef<{
    startIndex: number
    stopIndex: number
  } | null>(null)
  const initialFetchDoneRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleItemsRendered = useCallback(
    ({
      visibleStartIndex,
      visibleStopIndex
    }: {
      overscanStartIndex: number
      overscanStopIndex: number
      visibleStartIndex: number
      visibleStopIndex: number
    }) => {
      if (!file || rowCount === 0) return

      // Check if range has changed to avoid redundant fetches
      const lastRange = lastFetchedRangeRef.current
      if (
        lastRange &&
        lastRange.startIndex === visibleStartIndex &&
        lastRange.stopIndex === visibleStopIndex
      ) {
        return
      }

      // Abort previous fetch if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Update refs
      lastFetchedRangeRef.current = {
        startIndex: visibleStartIndex,
        stopIndex: visibleStopIndex
      }
      initialFetchDoneRef.current = true

      // Fetch data for visible items - indices directly map to file rows
      const ac = new AbortController()
      abortControllerRef.current = ac
      ensureRows(visibleStartIndex, visibleStopIndex, ac.signal).catch(
        (err) => {
          if (err?.name !== "AbortError") console.error(err)
        }
      )
    },
    [file, rowCount, ensureRows]
  )

  // Reset fetch tracking when file changes
  useEffect(() => {
    lastFetchedRangeRef.current = null
    initialFetchDoneRef.current = false
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [file])

  // Handle initial fetch if handleItemsRendered hasn't been called yet
  useEffect(() => {
    if (!file || rowCount === 0 || initialFetchDoneRef.current) return

    // If no visible range yet but we have rows, try to fetch initial visible range
    const estimatedVisibleRows =
      Math.ceil(dimensions.height / rowHeight) + overscanCount
    const initialStart = 0
    const initialEnd = Math.min(estimatedVisibleRows - 1, rowCount - 1)

    // Abort previous fetch if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const ac = new AbortController()
    abortControllerRef.current = ac
    ensureRows(initialStart, initialEnd, ac.signal).catch((err) => {
      if (err?.name !== "AbortError") console.error(err)
    })

    lastFetchedRangeRef.current = {
      startIndex: initialStart,
      stopIndex: initialEnd
    }
    initialFetchDoneRef.current = true

    return () => {
      ac.abort()
    }
  }, [
    file,
    ensureRows,
    rowCount,
    dimensions.height,
    overscanCount
  ])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    handleItemsRendered
  }
}
