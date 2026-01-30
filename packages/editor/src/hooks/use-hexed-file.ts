import { useEffect, useState } from "react"

import { HexedFile } from "@hexed/file"
import HexedWorkerConstructor from "@hexed/worker/worker?worker"

import { HexedFileInput } from "../types"
import { useResolveHandle } from "./use-resolve-handle"

export type OnHexedFileChange = (input: HexedFileInput) => void

export type UseHexedFile = ReturnType<typeof useHexedFile>

export const useHexedFile = (defaultInput?: HexedFileInput) => {
  const [input, setInput] = useState<HexedFileInput>(() => defaultInput)
  const [hexedFile, setHexedFile] = useState<HexedFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Resolve handleId (string) to FileSystemFileHandle
  const { fileHandle: resolvedHandle, error: handleError } = useResolveHandle(
    typeof input === "string" ? input : null
  )

  useEffect(() => {
    setInput((prev) => {
      if (prev === defaultInput) return prev
      return defaultInput
    })
  }, [defaultInput])

  // Create/dispose HexedFile instance
  useEffect(() => {
    // Dispose old instance
    if (hexedFile) {
      hexedFile.disconnect()
      setHexedFile(null)
    }

    // Determine the actual input to use for HexedFile
    let actualInput: HexedFileInput = input

    // If input is a string (handleId), use the resolved handle
    if (typeof input === "string") {
      if (resolvedHandle) {
        actualInput = resolvedHandle
      } else if (handleError) {
        setError(handleError)
        setHexedFile(null)
        return
      } else {
        // Still loading handle, wait
        setHexedFile(null)
        return
      }
    }

    // Create new instance
    if (actualInput === null || actualInput === undefined) {
      setError(null)
      setHexedFile(null)
      return
    }

    try {
      const newHexedFile = new HexedFile(actualInput, {
        watchChanges: true,
        workerConstructor: HexedWorkerConstructor
      })
      setHexedFile(newHexedFile)
      setError(null)

      // Listen for change events
      const handleChange = () => {
        // File changed, could trigger re-render if needed
      }

      newHexedFile.addEventListener("change", handleChange)

      return () => {
        newHexedFile.removeEventListener("change", handleChange)
        newHexedFile.disconnect()
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create HexedFile"
      setError(errorMessage)
      setHexedFile(null)
    }
  }, [input, resolvedHandle, handleError])

  // Extract handleId
  const handleId = typeof input === "string" ? input : null

  const result = {
    hexedFile,
    handleId,
    error: error || handleError
  }

  return [result, setInput] as const
}
