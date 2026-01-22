import { useCallback } from "react"
import type { FunctionComponent, RefObject } from "react"

import type { SelectionRange } from "../../types"
import { FindInput } from "../toolbar/find-input"

export type HexToolbarSearchProps = {
  showSearch: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  syncRangeToFindInput: SelectionRange
  onMatchFound: (offset: number, length: number) => void
  onClose: () => void
}

export const HexToolbarSearch: FunctionComponent<HexToolbarSearchProps> = ({
  showSearch,
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

  if (!showSearch) {
    return null
  }

  return (
    <div className="border-b">
      <div className="p-4">
        <FindInput
          inputRef={inputRef}
          syncRangeToFindInput={syncRangeToFindInput}
          onMatchFound={handleMatchFound}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
