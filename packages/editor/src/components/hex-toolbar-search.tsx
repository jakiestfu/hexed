import { useCallback } from "react"
import type { FunctionComponent, RefObject } from "react"

import { cn } from "@hexed/ui"

import { FindInput } from "./find-input"
import type { SelectionRange } from "../types"

export type HexToolbarSearchProps = {
  data?: Uint8Array
  showSearch: boolean
  hasFile: boolean
  hasSnapshots: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  syncRangeToFindInput: SelectionRange
  onMatchFound: (offset: number, length: number) => void
  onClose: () => void
}

export const HexToolbarSearch: FunctionComponent<HexToolbarSearchProps> = ({
  data,
  showSearch,
  hasFile,
  hasSnapshots,
  inputRef,
  syncRangeToFindInput,
  onMatchFound,
  onClose
}) => {
  const handleMatchFound = useCallback(
    (offset: number, length: number) => {
      onMatchFound(offset, length)
    },
    [onMatchFound]
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!hasFile || !showSearch || !hasSnapshots || !data) {
    return null
  }

  return (
    <div className="border-b">
      <div className="p-4">
        <FindInput
          data={data}
          inputRef={inputRef}
          syncRangeToFindInput={syncRangeToFindInput}
          onMatchFound={handleMatchFound}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
