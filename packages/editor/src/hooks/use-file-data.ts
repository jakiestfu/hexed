import { useEffect, useState } from "react"

type UseFileDataResult = {
  data: Uint8Array | null
  loading: boolean
  error: string | null
}

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset state when file is null
    if (!file) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Determine the range to read
        const startPos = start ?? 0
        const endPos = end ?? file.size

        // Validate range
        if (startPos < 0) {
          throw new Error("Start position must be >= 0")
        }
        if (endPos > file.size) {
          throw new Error(`End position (${endPos}) exceeds file size (${file.size})`)
        }
        if (startPos > endPos) {
          throw new Error("Start position must be <= end position")
        }

        let arrayBuffer: ArrayBuffer

        // If reading entire file, use arrayBuffer() directly
        if (startPos === 0 && endPos === file.size) {
          arrayBuffer = await file.arrayBuffer()
        } else {
          // Otherwise, slice the file and read the blob
          const blob = file.slice(startPos, endPos)
          arrayBuffer = await blob.arrayBuffer()
        }

        if (!cancelled) {
          setData(new Uint8Array(arrayBuffer))
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to read file data"
          setError(errorMessage)
          setData(null)
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [file, start, end])

  return { data, loading, error }
}
