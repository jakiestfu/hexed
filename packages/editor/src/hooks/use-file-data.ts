import { useEffect, useState } from "react"

import { createLogger } from "@hexed/logger"

type UseFileDataResult = {
  data: Uint8Array | null
  dataStartOffset: number | undefined
  dataEndOffset: number | undefined
  loading: boolean
  error: string | null
}

const logger = createLogger("useFileData")

/**
 * Hook to read data from a File object with optional range support
 * If start/end are not provided, reads the entire file
 * If start/end are provided, reads only that range
 */
export function useFileData(
  file: File | null,
  start?: number,
  end?: number
): UseFileDataResult {
  const [data, setData] = useState<Uint8Array | null>(null)
  const [dataStartOffset, setDataStartOffset] = useState<number | undefined>(
    undefined
  )
  const [dataEndOffset, setDataEndOffset] = useState<number | undefined>(
    undefined
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset state when file is null
    if (!file) {
      setData(null)
      setDataStartOffset(undefined)
      setDataEndOffset(undefined)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      // setLoading(true)
      // setError(null)

      try {
        // Determine the range to read
        const startPos = start ?? 0
        const endPos = end ?? file.size

        // Validate range
        if (startPos < 0) {
          throw new Error("Start position must be >= 0")
        }
        if (endPos > file.size) {
          throw new Error(
            `End position (${endPos}) exceeds file size (${file.size})`
          )
        }
        if (startPos > endPos) {
          throw new Error("Start position must be <= end position")
        }

        let arrayBuffer: ArrayBuffer

        // If reading entire file, use arrayBuffer() directly
        if (startPos === 0 && endPos === file.size) {
          arrayBuffer = await file.arrayBuffer()
          // No offset metadata needed when reading entire file
          if (!cancelled) {
            setDataStartOffset(undefined)
            setDataEndOffset(undefined)
          }
        } else {
          // Otherwise, slice the file and read the blob
          const blob = file.slice(startPos, endPos)
          arrayBuffer = await blob.arrayBuffer()
          // Store offset metadata when reading a range
          if (!cancelled) {
            setDataStartOffset(startPos)
            setDataEndOffset(endPos)
          }
        }

        if (!cancelled) {
          logger.log(`Read bytes [${startPos}-${endPos}]`)
          setData(new Uint8Array(arrayBuffer))
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to read file data"
          setError(errorMessage)
          setData(null)
          setDataStartOffset(undefined)
          setDataEndOffset(undefined)
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [file, start, end])

  return { data, dataStartOffset, dataEndOffset, loading, error }
}
