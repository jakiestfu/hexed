import { useEffect, useState } from "react"
import { useResolveFile } from "./use-resolve-file"
import { useResolveHandle } from "./use-resolve-handle"
import { HexedFileInput } from "../types"

export type OnHexedInputChange = (input: HexedFileInput) => void

export type UseHexedInput = ReturnType<typeof useHexedInput>

export const useHexedInput = (defaultInput: HexedFileInput) => {
  const [input, setInput] = useState<HexedFileInput>(() => defaultInput)

  useEffect(() => {
    setInput((prev) => {
      if (prev === defaultInput) return prev
      return defaultInput
    })
  }, [defaultInput])

  const { fileHandle, error: handleError } = useResolveHandle(input)
  const { file, error: fileError } = useResolveFile(fileHandle || input)

  const result = {
    file,
    fileHandle,
    handleId: typeof input === "string" ? input : null,
    error: handleError || fileError
  }
  console.log("RESULT", result)
  return [result, setInput] as const
}
