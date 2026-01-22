import { useEffect, useState } from "react"

import { HexedFileInput } from "../types"

/**
 * Hook to convert a FileSystemFileHandle to a File object
 * Manages loading state and error handling
 */
export function useResolveFile(input: HexedFileInput) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (input === null || input === undefined) {
      setFile(null)
      return
    }

    if (input instanceof File) {
      setFile(input)
      return
    }

    if (input && ArrayBuffer.isView(input)) {
      setFile(new File(Array.isArray(input) ? input : [input], "unknown"))
      return
    }

    // Reset state when handle is null
    if (!(input instanceof FileSystemFileHandle)) {
      setFile(null)
      setError(null)
      return
    }

    let cancelled = false

    const loadFile = async () => {
      try {
        const fileObj = await input.getFile()
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
  }, [input])

  return { file, error }
}
