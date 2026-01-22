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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset state when handle is null
    if (!fileHandle) {
      setFile(null)
      setError(null)
      return
    }

    let cancelled = false

    const loadFile = async () => {
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
