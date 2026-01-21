import { useCallback } from "react"
import type { FunctionComponent, RefObject } from "react"

import { cn } from "@hexed/ui"

import { useHandleIdToFileHandle } from "../hooks/use-hex-editor-file"
import type { SelectionRange } from "../types"
import { FindInput } from "./find-input"

export type HexToolbarSearchProps = {
  handleId: string | null | undefined
  showSearch: boolean
  hasFile: boolean
  hasSnapshots: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  syncRangeToFindInput: SelectionRange
  onMatchFound: (offset: number, length: number) => void
  onClose: () => void
}

export const HexToolbarSearch: FunctionComponent<HexToolbarSearchProps> = ({
  handleId,
  showSearch,
  hasFile,
  hasSnapshots,
  inputRef,
  syncRangeToFindInput,
  onMatchFound,
  onClose
}) => {
  const { fileHandle } = useHandleIdToFileHandle(handleId)

  const handleMatchFound = useCallback(
    (offset: number, length: number) => {
      onMatchFound(offset, length)
    },
    [onMatchFound]
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!hasFile || !showSearch) {
    return null
  }

  return (
    <div className="border-b">
      <div className="p-4">
        <FindInput
          fileId={handleId}
          fileHandle={fileHandle}
          inputRef={inputRef}
          syncRangeToFindInput={syncRangeToFindInput}
          onMatchFound={handleMatchFound}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
