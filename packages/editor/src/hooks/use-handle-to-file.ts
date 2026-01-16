import { useEffect, useState } from "react"

type UseHandleToFileResult = {
  file: File | null
  loading: boolean
  error: string | null
}

/**
 * Hook to convert a FileSystemFileHandle to a File object
 * Manages loading state and error handling
 */
export function useHandleToFile(
  fileHandle: FileSystemFileHandle | null
): UseHandleToFileResult {
  const [file, setFile] = useState<File | null>(null)
  // const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset state when handle is null
    if (!fileHandle) {
      setFile(null)
      // setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const loadFile = async () => {
      // setLoading(true)
      // setError(null)
      console.log("loadFile", fileHandle)

      try {
        const fileObj = await fileHandle.getFile()
        if (!cancelled) {
          setFile(fileObj)
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get file"
          setError(errorMessage)
          setFile(null)
          // setLoading(false)
        }
      }
    }

    loadFile()

    return () => {
      cancelled = true
    }
  }, [fileHandle])

  return { file, loading: false, error }
}
